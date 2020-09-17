const get = require('lodash.get')
const Project = require('@lerna/project')

const { ExternalResources } = require('./resources')
const updatePackageVersions = require('./updatePackageVersions')
const updatePackageDependencies = require('./updatePackageDependencies')
const getChangedPackages = require('./getChangedPackages')
const writePackageJsonFiles = require('./writePackageJsonFiles')
const publishPackages = require('./publishPackages')
const writeLatestVersionsFile = require('./writeLatestVersionsFile')
const createTags = require('./createTags')
const resetChanges = require('./resetChanges')

async function monodeploy(
    { registryUrl, changelogPreset, latestVersionsFile } = {},
    cwd = process.cwd(),
    resources = new ExternalResources(),
) {
    const project = new Project(cwd)
    const packages = await project.getPackages()

    await updatePackageVersions(resources, packages, { registryUrl })
    const changedPackages = getChangedPackages(packages, {
        cwd,
        ignoreChanges: get(project.config, 'command.publish.ignoreChanges', []),
    })
    updatePackageDependencies(changedPackages, packages)
    await writePackageJsonFiles(changedPackages)

    await publishPackages(resources, changedPackages, {
        registryUrl,
        changelogPreset,
        cwd,
    })

    const allPackagesWithUpdates = await project.getPackages()

    await createTags(
        allPackagesWithUpdates.filter(pkg =>
            changedPackages.find(
                changedPackage => changedPackage.name === pkg.name,
            ),
        ),
        { cwd },
    )
    await resetChanges(cwd)
    await writeLatestVersionsFile(latestVersionsFile, allPackagesWithUpdates, {
        cwd,
    })
}

module.exports = monodeploy
