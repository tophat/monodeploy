import mockRegistry from '../../test/mock-registry'
import getPackageInfo from '../get-package-info'

const helpers = jest.genMockFromModule('../command-helpers')

let lernaUpdatedSucceeds = true
helpers.getLernaUpdatedJson = () =>
    lernaUpdatedSucceeds
        ? getPackageInfo({ useRegistry: true }).then(
            list => JSON.stringify(list),
        )
        : Promise.reject(new Error())
helpers.__setLernaUpdatedSucceeds = value => {
    lernaUpdatedSucceeds = value
}

helpers.getNpmVersionFromRegistry = packageName =>
    Promise.resolve(mockRegistry.view(packageName) || '0.1.0')

let lernaPublishSucceeds = true
helpers.lernaPublish = jest.fn(
    () =>
        lernaPublishSucceeds
            ? helpers.getLernaUpdatedJson().then(lernaUpdatedJson =>
                  JSON.parse(lernaUpdatedJson).reduce(
                      (map, { name, version }) => ({
                          ...map,
                          [name]: version,
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
