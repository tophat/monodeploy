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
                if (e.name === 'PackageNotFoundError') {
                    // Note that lerna specifically avoids bumping the major
                    // version if the package is < 1.0.0, see
                    // https://github.com/lerna/lerna/pull/2486.  Therefore,
                    // monodeploy currently provides no way to bump the major
                    // version if the package is < 1.0.0.
                    pkg.version = '1.0.0'
                } else {
                    // TODO: retry
                    throw e
                }
            }
        }),
    )
}

module.exports = updatePackageVersions
