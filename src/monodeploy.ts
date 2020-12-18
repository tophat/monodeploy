import { Configuration, Project } from '@yarnpkg/core'
import { PortablePath } from '@yarnpkg/fslib'
import NpmPlugin from '@yarnpkg/plugin-npm'

import type {
    MonodeployConfiguration,
    YarnContext,
    PackageStrategyMap,
} from './types'

import logging from './logging'
import getLatestPackageTags from './core/getLatestPackageTags'
import getExplicitVersionStrategies from './core/getExplicitVersionStrategies'
import getImplicitVersionStrategies from './core/getImplicitVersionStrategies'
import applyReleases from './core/applyReleases'
import getRegistryUrl from './utils/getRegistryUrl'
import { prettyPrintMap } from './utils/prettyPrint'
import { backupPackageJsons, restorePackageJsons } from './utils/backupPackage'

const monodeploy = async (config: MonodeployConfiguration): Promise<void> => {
    const cwd = config.cwd as PortablePath
    const configuration = await Configuration.find(cwd, {
        modules: new Map([['@yarnpkg/plugin-npm', NpmPlugin]]),
        plugins: new Set([`@yarnpkg/plugin-npm`]),
    })
    const { project, workspace } = await Project.find(configuration, cwd)

    if (!workspace) throw new Error(`Workspace required! Cwd: ${cwd}`)

    const context: YarnContext = {
        configuration,
        project,
        workspace,
    }

    // Determine registry
    const registryUrl = await getRegistryUrl(config, context)
    logging.debug(`Registry Url: ${registryUrl}`)

    // Fetch latest package versions for workspaces
    const registryTags = await getLatestPackageTags(config, context)
    logging.debug(`Registry Tags`, prettyPrintMap(registryTags))

    // Determine version bumps via commit messages
    const explicitVersionStrategies = await getExplicitVersionStrategies(
        config,
        context,
    )

    // Determine version bumps to dependent packages
    const implicitVersionStrategies = await getImplicitVersionStrategies(
        config,
        context,
        explicitVersionStrategies,
    )

    const versionStrategies: PackageStrategyMap = new Map([
        ...explicitVersionStrategies.entries(),
        ...implicitVersionStrategies.entries(),
    ])

    logging.debug(`Version Strategies`, prettyPrintMap(versionStrategies))

    if (!versionStrategies.size) {
        logging.warning('No packages need to be updated.')
        return
    }

    // Backup workspace package.jsons
    const backupKey = await backupPackageJsons(config, context)
    logging.debug(`Backup Key: ${backupKey}`)

    try {
        // Apply releases, and update package.jsons
        await applyReleases(config, context, registryTags, versionStrategies)

        // Publish (+ Git Tags)
        // TODO
    } catch (err) {
        // TODO: Handle errors
        logging.error(err)
    } finally {
        // Restore workspace package.jsons
        //await restorePackageJsons(config, context, backupKey)
    }

    logging.debug(`Monodeploy completed successfully.`)
}

export default monodeploy
