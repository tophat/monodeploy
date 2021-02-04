const nodeEnv = process.env.NODE_ENV ?? 'production'

export const assertProduction = (): void => {
    if (nodeEnv !== 'production') {
        throw new Error(
            `Invariant Violation: Invalid environment ${process.env.NODE_ENV} !== production.`,
        )
    }
}

export const assertProductionOrTest = (): void => {
    if (nodeEnv !== 'production' && nodeEnv !== 'test') {
        throw new Error(
            `Invariant Violation: Invalid environment ${process.env.NODE_ENV} is not one of production, or test.`,
        )
    }
}
