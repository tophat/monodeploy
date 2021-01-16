module.exports = {
    presets: [
        [
            '@babel/preset-env',
            {
                targets: { node: '14.15.2' },
            },
        ],
        '@babel/preset-typescript',
    ],
    plugins: [],
}
