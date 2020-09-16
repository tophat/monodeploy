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
        console.log('in get package latest version', registryUrl)
        try {
            return Promise.resolve(
                this.registryManager.getLatestVersion(packageName, registryUrl),
            )
        } catch (e) {
            return Promise.reject(e)
        }
    }

    async publish(options) {
        await lernaVersion(options)
        const packages = await getPackages(options.cwd)
        for (const pkg of packages) {
            this.registryManager.publish(pkg.toJSON(), options.registry)
        }
    }
}

export default InMemoryResources
