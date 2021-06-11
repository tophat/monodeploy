const CI = process.env.CI === '1'
const ARTIFACT_DIR = process.env.ARTIFACT_DIR || 'artifacts'

module.exports = {
    include: ['packages/**/src/**/*.ts'],
    exclude: [
        '.yarn/**',
        'packages/**/src/**/*.test.ts',
        'packages/**/src/**/*.mock.ts',
        'packages/**/src/**/__mocks__',
    ],
    reportDir: `${ARTIFACT_DIR}/test_results/tests-report/`,
    reporter: ['text-summary', ...(CI ? [] : ['html'])],
    tempDir: `raw-coverage/jest-e2es/`,
    require: [
        require.resolve('ts-node/register'),
    ],
    extension: ['.ts'],
    instrument: true,
    all: true,
    cacheDir: './.nyc_cache',
}
