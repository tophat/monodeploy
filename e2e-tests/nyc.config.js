const ARTIFACT_DIR = process.env.ARTIFACT_DIR || 'artifacts'

module.exports = {
    include: ['packages/**/src/**/*.ts'],
    exclude: [
        '.yarn/**',
        'packages/**/src/**/*.test.ts',
        'packages/**/src/**/*.mock.ts',
        'packages/**/src/**/__mocks__',
    ],
    reportDir: `${ARTIFACT_DIR}/test_results/jest-e2es/`
}
