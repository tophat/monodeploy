const fs = require('fs')
const path = require('path')

const { getPackages } = require('@lerna/project')
const latestVersion = require('latest-version')
const PackageGraph = require('@lerna/package-graph')
const collectUpdates = require('@lerna/collect-updates')
const lernaVersion = require('@lerna/version')
const lernaPublish = require('@lerna/publish')

async function run() {
    const packages = await getPackages(process.cwd())

    for (const pkg of packages) {
        try {
            const version = await latestVersion(pkg.name)
            pkg.version = version
        } catch (e) {
            pkg.version = '0.1.0'
        }
    }

    const graph = new PackageGraph(packages)
    const changedPackages = collectUpdates(
        packages,
        graph,
        { cwd: process.cwd() },
        { ignoreChanges: [] },
    )

    // TODO: use package graph and localDependencies here
    changedPackages.forEach(({ pkg }) => {
        Object.keys(pkg.dependencies || {}).forEach(dependency => {
            const siblingPackage = packages.find(pkg => pkg.name === dependency)
            if (siblingPackage) {
                pkg.dependencies[dependency] = `^${siblingPackage.version}`
            }
        })
    })

    for (const { pkg } of changedPackages) {
        fs.writeFileSync(
            path.join(pkg.location, 'package.json'),
            JSON.stringify(pkg, null, 2),
        )
    }

    await lernaPublish({
        amend: true,
        yes: true,
        conventionalCommits: true,
    })
}

run()
