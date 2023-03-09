import { type Config } from '@jest/types'

const CI = process.env.CI === '1'
const ARTIFACT_DIR = process.env.ARTIFACT_DIR || 'artifacts'
const IS_E2E = process.env.E2E === '1'

const config: Config.InitialOptions = {
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
        '^.+\\.tsx?$': require.resolve('ts-jest'),
    },
    coverageReporters: CI ? ['json'] : ['text', 'json'],
    coverageDirectory: 'raw-coverage/jest/',
    collectCoverageFrom: ['packages/**/src/**/*.ts', '.yarn/__virtual__/**/packages/**/*.ts'],
    coveragePathIgnorePatterns: ['/node_modules/', '/__mocks__/', '\\.test.ts$', '\\.mock.ts$'],
    watchPathIgnorePatterns: [
        '<rootDir>/example-monorepo',
        '<rootDir>/artifacts',
        '<rootDir>/packages/.*/lib',
        '<rootDir>/packages/.*/.*\\.js',
    ],
    testPathIgnorePatterns: [
        '/node_modules/',
        '/.yarn/',
        '<rootDir>/.*\\.js',
        '<rootDir>/.*/lib/',
        ...(IS_E2E ? ['<rootDir>/packages'] : ['<rootDir>/e2e-tests']),
    ],
    haste: {
        throwOnModuleCollision: true,
    },
    modulePathIgnorePatterns: ['<rootDir>/.*/lib'],
    testTimeout: 30000,
    resolver: require.resolve('@tophat/jest-resolver'),
    ...(IS_E2E && {
        maxConcurrency: 1,
        maxWorkers: 1,
        testTimeout: 300000,
        verbose: true,
    }),
}

export default config
