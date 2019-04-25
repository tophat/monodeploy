import mockRegistry from '../../test/mock-registry'
import getPackageInfo from '../get-package-info'

const helpers = jest.genMockFromModule('../command-helpers')

let lernaUpdatedSucceeds = true

const getLernaUpdatedJson = () =>
    lernaUpdatedSucceeds
        ? getPackageInfo({ useRegistry: true }).then(list =>
              JSON.stringify(list),
          )
        : Promise.reject(new Error())

const __setLernaUpdatedSucceeds = value => {
    lernaUpdatedSucceeds = value
}

const getNpmVersionFromRegistry = packageName =>
    Promise.resolve(mockRegistry.view(packageName) || '0.1.0')

let lernaPublishSucceeds = true

const lernaPublish = jest.fn(() =>
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

const __setLernaPublishSucceeds = value => {
    lernaPublishSucceeds = value
}

let createGitTagSucceeds = true

const createGitTag = jest.fn(() =>
    createGitTagSucceeds ? Promise.resolve() : Promise.reject(new Error()),
)

const __setCreateGitTagSucceeds = value => {
    createGitTagSucceeds = value
}

const mocks = {
    getLernaUpdatedJson,
    __setLernaUpdatedSucceeds,
    getNpmVersionFromRegistry,
    lernaPublish,
    __setLernaPublishSucceeds,
    createGitTag,
    __setCreateGitTagSucceeds,
}

module.exports = Object.assign(helpers, mocks)
