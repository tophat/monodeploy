class RegistryManager {
    constructor() {
        this.registries = {}
    }

    publish(packageJson, registryUrl = 'DEFAULT_REGISTRY/') {
        const { name } = packageJson

        if (!this.registries[registryUrl]) {
            this.registries[registryUrl] = {}
        }

        if (!this.registries[registryUrl][name]) {
            this.registries[registryUrl][name] = []
        }

        this.registries[registryUrl][name].push(packageJson)
    }

    getLatestVersion(pkg, registryUrl = 'DEFAULT_REGISTRY/') {
        const versions = this.registries[registryUrl][pkg]
        return versions[versions.length - 1].version
    }
}

export default RegistryManager
