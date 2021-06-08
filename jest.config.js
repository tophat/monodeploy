const CI = process.env.CI === '1'
const ARTIFACT_DIR = process.env.ARTIFACT_DIR || 'artifacts'

module.exports = {
    ...(CI && {
        reporters: [
            'default',
            [
                'jest-junit',
                {
                    suiteName: 'Jest Tests',
                    outputDirectory: `${ARTIFACT_DIR}/test_results/jest/`,
                    outputName: 'jest.junit.xml',
                },
            ],
        ],
        collectCoverage: true,
    }),
    transform: {
        '^.+\\.[jt]sx?$': 'ts-jest',
    },
    coverageReporters: CI ? ['json'] : ['text-summary', 'json'],
    coverageDirectory: `raw-coverage/jest/`,
    collectCoverageFrom: [
        'packages/**/src/**/*.ts',
        '!.yarn/**',
        '!packages/**/src/**/*.test.ts',
        '!packages/**/src/**/*.mock.ts',
        '!packages/**/src/**/__mocks__',
    ],
    watchPathIgnorePatterns: [
        '<rootDir>/example-monorepo',
        '<rootDir>/artifacts',
        '<rootDir>/packages/.*/lib',
        '<rootDir>/packages/.*/.*\\.js'
    ],
    testPathIgnorePatterns: [
        '<rootDir>/.*\\.js',
        '<rootDir>/.*/lib/',
    ],
    haste: {
        throwOnModuleCollision: true,
    },
    modulePathIgnorePatterns: [
        "<rootDir>/.*/lib"
    ],
    testTimeout: 10000,
}
