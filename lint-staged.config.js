module.exports = {
    '{package.json,yarn.lock}': () => 'yarn dedupe',
    '*.{yml,yaml}': (filenames) => {
        const files = filenames.join(' ')
        return `yarn yaml-validator ${files}`
    },
    '*.ts': (filenames) => {
        const files = filenames.join(' ')
        return [
            `yarn eslint --ext .ts ${files}`,
            `yarn jest --bail --findRelatedTests ${files}`,
        ]
    },
}
