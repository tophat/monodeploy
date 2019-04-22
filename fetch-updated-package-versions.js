const {
    getLernaUpdatedJson,
    getNpmVersionFromRegistry,
} = require('./command-helpers')

async function fetchUpdatedPackageVersions() {
    const updatedJson = await getLernaUpdatedJson()
    const packageVersionPairs = await Promise.all(
        JSON.parse(updatedJson).map(({ name }) =>
            getNpmVersionFromRegistry(name).then(version => [name, version]),
        ),
    )
    return packageVersionPairs.reduce((map, [name, version]) => {
        map[name] = version // eslint-disable-line no-param-reassign
        return map
    }, {})
}

module.exports = fetchUpdatedPackageVersions
