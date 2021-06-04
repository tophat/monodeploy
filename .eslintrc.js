module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint', 'prettier'],
    extends: [
        'plugin:@typescript-eslint/recommended',
        '@tophat/eslint-config/base',
        '@tophat/eslint-config/jest',
        'prettier',
    ],
    rules: {
        '@typescript-eslint/no-non-null-assertion': 'off',
        'no-empty': ['error', { allowEmptyCatch: true }],
        'no-unused-vars': 'off', // covered by typescript eslint
        'import/order': [
            'error',
            {
                alphabetize: { order: 'asc' },
                'newlines-between': 'always',
                groups: [
                    'unknown',
                    'builtin',
                    'external',
                    'internal',
                    'parent',
                    'sibling',
                    'index',
                ],
            },
        ],
        'jest/no-standalone-expect': [
            'error',
            { additionalTestBlockFunctions: ['teste2e'] },
        ],
    },
    ignorePatterns: ['.*', '**/*.js', '**/lib'],
    settings: {
        'import/external-module-folders': ['node_modules', '.yarn'],
        'import/parsers': {
            '@typescript-eslint/parser': ['.ts', '.js'],
        },
        'import/resolver': {
            typescript: {
                alwaysTryTypes: true,
            },
            '@tophat/eslint-import-resolver-require': {},
        },
    },
}
