function updatePackageVersions(resources, packages, { registryUrl }) {
    return Promise.all(
        packages.map(async pkg => {
            try {
                const version = await resources.getPackageLatestVersion(
                    pkg.name,
                    { registryUrl },
                )
                pkg.version = version
            } catch (e) {
                // TODO: actually check the error code here instead of assuming
                // the package doesn't exist
                pkg.version = '0.1.0'
            }
        }),
    )
}

module.exports = updatePackageVersions
