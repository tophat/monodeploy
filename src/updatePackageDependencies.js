function updatePackageDependencies(packagesToUpdate, allPackages) {
    // TODO: use package graph and localDependencies here
    packagesToUpdate.forEach(({ pkg }) => {
        Object.keys(pkg.dependencies || {}).forEach(dependency => {
            const siblingPackage = allPackages.find(
                pkg => pkg.name === dependency,
            )
            if (siblingPackage) {
                pkg.dependencies[dependency] = `^${siblingPackage.version}`
            }
        })
    })
}

module.exports = updatePackageDependencies
