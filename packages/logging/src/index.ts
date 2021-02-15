import chalk from 'chalk'

export * from './invariants'

export const LOG_LEVELS = {
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
    [LOG_LEVELS.INFO]: chalk.reset,
    [LOG_LEVELS.WARNING]: chalk.yellow,
    [LOG_LEVELS.ERROR]: chalk.red,
}

const loggerOpts = {
    dryRun: false,
}

const getCurrentLogLevel = () => {
    const envLogLevel = Number(process.env.MONODEPLOY_LOG_LEVEL)
    return isNaN(envLogLevel) ? LOG_LEVELS.WARNING : envLogLevel
}

const createLogger = (level: LogLevelType): Logger => (
    ...args: unknown[]
): void => {
    if (getCurrentLogLevel() > level) return
    const date = new Date()
    const timestamp = `[${String(date.getHours()).padStart(2, '0')}:${String(
        date.getMinutes(),
    ).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}.${String(
        date.getMilliseconds(),
    ).padStart(3, '0')}]`
    const colour = levelToColour[level]

    const line = [chalk.yellow(timestamp)]
    if (loggerOpts.dryRun && level === LOG_LEVELS.INFO) {
        line.push(chalk.grey('[Dry Run]'))
    }
    line.push((colour as Formatter)(args[0]))

    const logFn = level >= LOG_LEVELS.WARNING ? console.error : console.log

    logFn(line.join(' '))
    if (args.length > 1) {
        for (const arg of args.slice(1)) {
            logFn((colour as Formatter)(arg))
        }
    }
}

const setDryRun = (value: boolean): void => {
    loggerOpts.dryRun = value
}

const logger = {
    debug: createLogger(LOG_LEVELS.DEBUG),
    info: createLogger(LOG_LEVELS.INFO),
    warning: createLogger(LOG_LEVELS.WARNING),
    error: createLogger(LOG_LEVELS.ERROR),
    setDryRun,
}

export default logger
