module.exports = {
    presets: [
        [
            '@babel/preset-env',
            {
                targets: { node: '12.16.1' },
            },
        ],
    ],
    plugins: [
        '@babel/plugin-proposal-nullish-coalescing-operator',
        '@babel/plugin-proposal-optional-chaining',
    ],
}
