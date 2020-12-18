import chalk from 'chalk'

const LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARNING: 2,
    ERROR: 3,
} as const

type LogLevelType = typeof LOG_LEVELS[keyof typeof LOG_LEVELS]

type Formatter = (arg: unknown) => string

const levelToColour = {
    [LOG_LEVELS.DEBUG]: chalk.magenta,
    [LOG_LEVELS.INFO]: chalk.grey,
    [LOG_LEVELS.WARNING]: chalk.yellow,
    [LOG_LEVELS.ERROR]: chalk.red,
}

const getCurrentLogLevel = () => {
    try {
        const envLogLevel = process.env.MONODEPLOY_LOG_LEVEL
        if (envLogLevel !== undefined) {
            const logLevel = Number(envLogLevel)
            return logLevel ?? LOG_LEVELS.WARNING
        }
    } catch {}
    return LOG_LEVELS.WARNING
}

const createLogger = (level: LogLevelType) => (...args: unknown[]): void => {
    if (getCurrentLogLevel() > level) return
    const timestamp = `[${Date.now()}]`
    const colour = levelToColour[level]
    console.log(
        chalk.yellow(timestamp),
        ...args.map((a, index) => (index > 0 ? a : (colour as Formatter)(a))),
    )
}

const logger = {
    debug: createLogger(LOG_LEVELS.DEBUG),
    info: createLogger(LOG_LEVELS.INFO),
    warning: createLogger(LOG_LEVELS.WARNING),
    error: createLogger(LOG_LEVELS.ERROR),
}

export default logger
