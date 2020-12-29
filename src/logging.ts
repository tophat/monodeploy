import { Writable } from 'stream'

import chalk from 'chalk'

const LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARNING: 2,
    ERROR: 3,
} as const

type LogLevelType = typeof LOG_LEVELS[keyof typeof LOG_LEVELS]

type Logger = (...args: unknown[]) => void

type Formatter = (arg: unknown) => string

const levelToColour = {
    [LOG_LEVELS.DEBUG]: chalk.magenta,
    [LOG_LEVELS.INFO]: chalk.grey,
    [LOG_LEVELS.WARNING]: chalk.yellow,
    [LOG_LEVELS.ERROR]: chalk.red,
}

const leftPad = (value: string | number, padding: number): string => {
    const str = String(value)
    const whitespace = '0'.repeat(Math.max(padding - str.length, 0))
    return `${whitespace}${str}`
}

const getCurrentLogLevel = () => {
    try {
        const envLogLevel = process.env.MONODEPLOY_LOG_LEVEL
        if (envLogLevel !== undefined) {
            const logLevel = Number(envLogLevel)
            return logLevel ?? LOG_LEVELS.WARNING
        }
    } catch {} // eslint-disable-line no-empty
    return LOG_LEVELS.WARNING
}

const createLogger = (level: LogLevelType): Logger => (
    ...args: unknown[]
): void => {
    if (getCurrentLogLevel() > level) return
    const date = new Date()
    const timestamp = `[${leftPad(date.getHours(), 2)}:${leftPad(
        date.getMinutes(),
        2,
    )}:${leftPad(date.getSeconds(), 2)}.${leftPad(date.getMilliseconds(), 3)}]`
    const colour = levelToColour[level]

    console.log(chalk.yellow(timestamp), (colour as Formatter)(args[0]))
    if (args.length > 1) {
        for (const arg of args.slice(1)) {
            console.log(arg)
        }
    }
}

const logger = {
    debug: createLogger(LOG_LEVELS.DEBUG),
    info: createLogger(LOG_LEVELS.INFO),
    warning: createLogger(LOG_LEVELS.WARNING),
    error: createLogger(LOG_LEVELS.ERROR),
}

export const asStream = (loggerFn: Logger): Writable =>
    new Writable({
        write(chunk, encoding) {
            loggerFn(chunk.toString(encoding))
        },
    })

export default logger