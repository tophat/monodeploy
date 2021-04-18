module.exports = {
    '{package.json,yarn.lock}': () => 'yarn dedupe',
    '*.{yml,yaml}': () => 'yarn yaml-validator',
    '*.ts': (filenames) => {
        const files = filenames.join(' ')
        return [
            `yarn eslint --ext .ts ${files}`,
            `yarn jest --bail --findRelatedTests ${files}`
        ]
    },
}
