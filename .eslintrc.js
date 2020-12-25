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
        'jest/no-standalone-expect': 'off',
        'prettier/prettier': [
            'error',
            {
                printWidth: 80,
                tabWidth: 4,
                semi: false,
                trailingComma: 'all',
                singleQuote: true,
                arrowParens: 'avoid',
            },
        ],
        eqeqeq: 'error',
        'prefer-const': 'error',
        'prefer-template': 'error',
        'no-nested-ternary': 'error',
        'no-useless-computed-key': 'error',
        'no-duplicate-imports': 'error',
        camelcase: ['error', { properties: 'never' }],
        'dot-notation': 'error',
        'no-unused-vars': 'off', // covered by typescript eslint
    },
    ignorePatterns: ['example-monorepo/**/*', '.*', '**/*.js', 'lib'],
    settings: {
        'import/resolver': {
            node: {
                extensions: ['.ts', '.js'],
            },
        },
    },
}
