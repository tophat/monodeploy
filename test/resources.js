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
        try {
            return Promise.resolve(
                this.registryManager.getLatestVersion(packageName, registryUrl),
            )
        } catch (e) {
            return Promise.reject(e)
        }
    }

    async publish(changedPackages, options) {
        await lernaVersion(options)
        const packages = await getPackages(options.cwd)
        for (const changedPackage of changedPackages) {
            this.registryManager.publish(
                packages.find(pkg => pkg.name === changedPackage.name).toJSON(),
                options.registry,
            )
        }
    }
}

export default InMemoryResources
