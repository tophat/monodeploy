module.exports = {
    presets: [
        [
            '@babel/preset-env',
            {
                targets: { node: '14.15.5' },
            },
        ],
        '@babel/preset-typescript',
    ],
    plugins: [],
}
