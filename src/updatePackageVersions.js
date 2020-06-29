async function updatePackageVersions(resources, packages, { registryUrl }) {
    for (const pkg of packages) {
        try {
            const version = await resources.getPackageLatestVersion(pkg.name, {
                registryUrl,
            })
            pkg.version = version
        } catch (e) {
            pkg.version = '0.1.0'
        }
    }
}

module.exports = updatePackageVersions
