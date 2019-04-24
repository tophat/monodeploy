const helpers = jest.genMockFromModule('../command-helpers')

let lernaUpdatedJson = JSON.stringify([])
let lernaUpdatedSucceeds = true
helpers.getLernaUpdatedJson = () =>
    lernaUpdatedSucceeds
        ? Promise.resolve(lernaUpdatedJson)
        : Promise.reject(new Error())
helpers.__setLernaUpdatedJson = obj => {
    lernaUpdatedJson = JSON.stringify(obj)
}
helpers.__setLernaUpdatedSucceeds = value => {
    lernaUpdatedSucceeds = value
}

const npmRegistryVersions = {}
helpers.getNpmVersionFromRegistry = packageName =>
    Promise.resolve(npmRegistryVersions[packageName] || '0.1.0')
helpers.__setNpmRegistryVersion = (packageName, version) => {
    npmRegistryVersions[packageName] = version
}

let lernaPublishSucceeds = true
helpers.lernaPublish = jest.fn(
    () =>
        lernaPublishSucceeds
            ? Promise.resolve(
                  JSON.parse(lernaUpdatedJson).reduce(
                      (map, { name, version }) => ({
                          ...map,
                          [name]: `${version}1`,
                      }),
                      {},
                  ),
              )
            : Promise.reject(new Error()),
)
helpers.__setLernaPublishSucceeds = value => {
    lernaPublishSucceeds = value
}

let createGitTagSucceeds = true
helpers.createGitTag = jest.fn(
    () =>
        createGitTagSucceeds ? Promise.resolve() : Promise.reject(new Error()),
)
helpers.__setCreateGitTagSucceeds = value => {
    createGitTagSucceeds = value
}

module.exports = helpers
