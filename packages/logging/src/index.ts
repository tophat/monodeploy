import { type Writable } from 'stream'
import util from 'util'

import { MessageName, type Report, miscUtils } from '@yarnpkg/core'

export * from './invariants'

export const LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARNING: 2,
    ERROR: 3,
} as const

type LogLevelType = (typeof LOG_LEVELS)[keyof typeof LOG_LEVELS]

type Logger = (
    message: string | Error | unknown,
    { report, extras }: { report?: Report | null; extras?: string },
) => void

export class ErrorsReported extends Error {}

const loggerOpts: { dryRun: boolean } = {
    dryRun: false,
}

const getCurrentLogLevel = () => {
    const envLogLevel = Number(process.env.MONODEPLOY_LOG_LEVEL)
    return isNaN(envLogLevel) ? LOG_LEVELS.INFO : envLogLevel
}

const createLogger =
    (level: LogLevelType): Logger =>
    (message, { report, extras }): void => {
        if (getCurrentLogLevel() > level) return

        if (!report) {
            if (!process.env.MONODEPLOY_DISABLE_LOGS) {
                process.stdout.write(`${util.format(message)}\n`)
            }
            return
        }

        if (message instanceof Error) {
            report.reportExceptionOnce(message)
            return
        }

        const normalizedMessage = String(message)

        if (level === LOG_LEVELS.ERROR) {
            report.reportError(MessageName.UNNAMED, normalizedMessage)
        } else if (level === LOG_LEVELS.WARNING) {
            report.reportWarning(MessageName.UNNAMED, normalizedMessage)
        } else if (level === LOG_LEVELS.INFO || level === LOG_LEVELS.DEBUG) {
            report.reportInfo(
                MessageName.UNNAMED,
                loggerOpts.dryRun ? `[Dry Run] ${normalizedMessage}` : normalizedMessage,
            )
        }

        if (extras) {
            report.reportInfo(MessageName.UNNAMED, extras)
        }
    }

const setDryRun = (value: boolean): void => {
    loggerOpts.dryRun = value
}

const createReportStream = ({
    report,
    prefix,
}: {
    report: Report
    prefix: string | null
}): [Writable, Promise<boolean>] => {
    const streamReporter = report.createStreamReporter(prefix)

    const defaultStream = new miscUtils.DefaultStream()
    defaultStream.pipe(streamReporter, { end: false })
    defaultStream.on('finish', () => {
        streamReporter.end()
    })

    const promise = new Promise<boolean>((resolve) => {
        streamReporter.on('finish', () => {
            resolve(defaultStream.active)
        })
    })

    return [defaultStream, promise]
}

const logger = {
    debug: createLogger(LOG_LEVELS.DEBUG),
    info: createLogger(LOG_LEVELS.INFO),
    warning: createLogger(LOG_LEVELS.WARNING),
    error: createLogger(LOG_LEVELS.ERROR),
    setDryRun,
    createReportStream,
}

export default logger
