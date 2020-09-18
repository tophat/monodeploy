const DEFAULT_REGISTRY = 'DEFAULT_REGISTRY'

import { PackageNotFoundError } from 'package-json'

class RegistryManager {
    constructor() {
        this.registries = {}
        this.fetchesToFail = {}
        this.createRegistry(DEFAULT_REGISTRY)
    }

    createRegistry(name) {
        if (this.registries[name]) {
            throw new Error(`Registry ${name} already exists`)
        }
        this.registries[name] = {}
    }

    publish(packageJson, registryUrl = DEFAULT_REGISTRY) {
        const { name } = packageJson

        if (!this.registries[registryUrl]) {
            this.registries[registryUrl] = {}
        }

        if (!this.registries[registryUrl][name]) {
            this.registries[registryUrl][name] = []
        }

        this.registries[registryUrl][name].push(packageJson)
    }

    failFetchForPackage(pkg, error) {
        this.fetchesToFail[pkg] = error
    }

    getLatestVersion(pkg, registryUrl = DEFAULT_REGISTRY) {
        if (this.fetchesToFail[pkg]) {
            throw this.fetchesToFail[pkg]
        }
        return this.getPackageJSON(pkg, registryUrl).version
    }

    getPackageJSON(pkg, registryUrl = DEFAULT_REGISTRY) {
        if (!this.registries[registryUrl]) {
            throw new Error(`Registry ${registryUrl} does not exist`)
        }
        const versions = this.registries[registryUrl][pkg]
        if (!versions) {
            throw new PackageNotFoundError(pkg)
        }
        return versions[versions.length - 1]
    }
}

export default RegistryManager
