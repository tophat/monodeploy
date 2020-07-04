import lernaVersion from '@lerna/version'
import { getPackages } from '@lerna/project'

import { ResourceInterface } from '../src/resources'

import RegistryManager from './mockRegistry'

class InMemoryResources extends ResourceInterface {
    constructor(registryManager = new RegistryManager()) {
        super()
        this.registryManager = registryManager
    }

    getPackageLatestVersion(packageName, { registryUrl } = {}) {
        return Promise.resolve(
            this.registryManager.getLatestVersion(packageName, registryUrl),
        )
    }

    async publish(options) {
        await lernaVersion(options)
        const packages = await getPackages(options.cwd)
        for (const pkg of packages) {
            this.registryManager.publish(pkg.toJSON(), options.registryUrl)
        }
    }
}

export default InMemoryResources
