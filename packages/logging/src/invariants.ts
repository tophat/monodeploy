export const assertProduction = (): void => {
    const nodeEnv = process.env.NODE_ENV ?? 'production'
    if (nodeEnv !== 'production') {
        throw new Error(
            `Invariant Violation: Invalid environment ${process.env.NODE_ENV} !== production.`,
        )
    }
}

export const assertProductionOrTest = (): void => {
    const nodeEnv = process.env.NODE_ENV ?? 'production'
    if (nodeEnv !== 'production' && nodeEnv !== 'test') {
        throw new Error(
            `Invariant Violation: Invalid environment ${process.env.NODE_ENV} is not one of production, or test.`,
        )
    }
}
