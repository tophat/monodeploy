module.exports = (() => {
    const config = (options = {}) => ({
        parserOpts: options,
        recommendedBumpOpts: {
            whatBump: () => {
                const pinnedLevel =
                    process.env._TEST_VERSION_PIN_STRATEGY_LEVEL_ || null
                if (process.env._TEST_VERSION_RETURN_NULL_) {
                    return null
                }
                return {
                    level: pinnedLevel === null ? null : Number(pinnedLevel),
                }
            },
        },
    })

    return config
})()
