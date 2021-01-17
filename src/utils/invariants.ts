export const assertProduction = (): void => {
    if (process.env.NODE_ENV !== 'production') {
        throw new Error(
            `Invariant Violation: Invalid environment ${process.env.NODE_ENV} !== production.`,
        )
    }
}

export const assertProductionOrTest = (): void => {
    if (
        process.env.NODE_ENV !== 'production' &&
        process.env.NODE_ENV !== 'test'
    ) {
        throw new Error(
            `Invariant Violation: Invalid environment ${process.env.NODE_ENV} is not one of production, or test.`,
        )
    }
}
