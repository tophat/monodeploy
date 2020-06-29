const collectUpdates = require('@lerna/collect-updates')
const PackageGraph = require('@lerna/package-graph')

function getChangedPackages(packages, { cwd, ignoreChanges = [] }) {
    const graph = new PackageGraph(packages)

    const changedPackages = collectUpdates(
        packages,
        graph,
        { cwd },
        { ignoreChanges },
    )

    return changedPackages
}

module.exports = getChangedPackages
