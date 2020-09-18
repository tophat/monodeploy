const lernaPublish = require('@lerna/publish')
const latestVersion = require('latest-version')

class ResourceInterface {
    // eslint-disable-next-line no-unused-vars
    getPackageLatestVersion(name, { registryUrl } = {}) {
        throw new Error('not implemented!')
    }

    // eslint-disable-next-line no-unused-vars
    publish(changedPackages, options) {
        throw new Error('not implemented!')
    }
}

class ExternalResources extends ResourceInterface {
    getPackageLatestVersion(name, { registryUrl } = {}) {
        return latestVersion(name, registryUrl ? { registryUrl } : {})
    }

    publish(changedPackages, options) {
        return lernaPublish(options)
    }
}

Object.assign(exports, {
    ResourceInterface,
    ExternalResources,
})
