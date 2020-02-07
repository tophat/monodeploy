const fs = require('fs')
const path = require('path')

const { getPackages } = require('@lerna/project')
const latestVersion = require('latest-version')
const PackageGraph = require('@lerna/package-graph')
const collectUpdates = require('@lerna/collect-updates')
const lernaPublish = require('@lerna/publish')

async function run({ registry, changelogPreset } = {}) {
    const packages = await getPackages(process.cwd())

    for (const pkg of packages) {
        try {
            const version = await latestVersion(
                pkg.name,
                registry ? { registryUrl: registry } : {},
            )
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
        // TODO: pass relevant command options here
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

    const lernaPublishOptions = {
        amend: true,
        yes: true,
        conventionalCommits: true,
    }

    if (registry) {
        lernaPublishOptions.registry = registry
    }

    if (changelogPreset) {
        lernaPublishOptions.changelogPreset = changelogPreset
    }

    await lernaPublish(lernaPublishOptions)

    // TODO: if publish fails, try again with "from-git" or "from-package"

    // TODO: Write latest versions file
}

const [registry] = process.argv.slice(2)

run({ registry })
