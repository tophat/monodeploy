const fs = require('fs')
const path = require('path')

const Project = require('@lerna/project')
const PackageGraph = require('@lerna/package-graph')
const collectUpdates = require('@lerna/collect-updates')

const { ExternalResources } = require('./resources')

async function monodeploy(
    { registryUrl, changelogPreset, latestVersionsFile } = {},
    cwd = process.cwd(),
    resources = new ExternalResources(),
) {
    const project = new Project(cwd)
    const packages = await project.getPackages()

    for (const pkg of packages) {
        try {
            const version = await resources.getPackageLatestVersion(
                pkg.name,
                registryUrl,
            )
            pkg.version = version
        } catch (e) {
            pkg.version = '0.1.0'
        }
    }

    const graph = new PackageGraph(packages)

    const { command: commandOptions = {} } = project.config
    const changedPackages = collectUpdates(
        packages,
        graph,
        { cwd },
        {
            ignoreChanges:
                (commandOptions.publish &&
                    commandOptions.publish.ignoreChanges) ||
                [],
        },
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

    const publishOptions = {
        amend: true,
        yes: true,
        conventionalCommits: true,
        registry: registryUrl,
        changelogPreset,
    }

    await resources.publish(publishOptions, cwd)
    // TODO: if publish fails, try again with "from-git" or "from-package"

    if (!latestVersionsFile) {
        return
    }

    const updatedPackages = await project.getPackages()

    const packageInfo = updatedPackages.reduce((info, pkg) => {
        const { version, name, description } = pkg.toJSON()
        return info.concat({ version, name, description })
    }, {})

    fs.writeFileSync(
        path.join(cwd, latestVersionsFile),
        JSON.stringify(packageInfo, null, 2),
    )
}

module.exports = monodeploy
