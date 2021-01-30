import path from 'path'

import { Configuration, Project } from '@yarnpkg/core'
import { PortablePath } from '@yarnpkg/fslib'
import NpmPlugin from '@yarnpkg/plugin-npm'

import applyReleases from './core/applyReleases'
import getExplicitVersionStrategies from './core/getExplicitVersionStrategies'
import getImplicitVersionStrategies from './core/getImplicitVersionStrategies'
import getLatestPackageTags from './core/getLatestPackageTags'
import prependChangelogFile from './core/prependChangelogFile'
import publishPackages from './core/publishPackages'
import writeChangesetFile from './core/writeChangesetFile'
import logging from './logging'
import type {
    ChangesetSchema,
    MonodeployConfiguration,
    PackageStrategyMap,
    RecursivePartial,
    YarnContext,
} from './types'
import { backupPackageJsons, restorePackageJsons } from './utils/backupPackage'
import getRegistryUrl from './utils/getRegistryUrl'
import getWorkspacesToPublish from './utils/getWorkspacesToPublish'
import mergeDefaultConfig from './utils/mergeDefaultConfig'

export { ChangesetSchema, MonodeployConfiguration } from './types'

const monodeploy = async (
    baseConfig: RecursivePartial<MonodeployConfiguration>,
): Promise<ChangesetSchema> => {
    const config: MonodeployConfiguration = await mergeDefaultConfig(baseConfig)

    logging.setDryRun(config.dryRun)
    logging.debug(
        `Starting monodeploy with config:`,
        JSON.stringify(config, null, 2),
    )

    const cwd = path.resolve(process.cwd(), config.cwd) as PortablePath
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
    logging.debug(`[Config] Registry Url: ${registryUrl}`)

    // Fetch latest package versions for workspaces
    const registryTags = await getLatestPackageTags(config, context)

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

    if (!versionStrategies.size) {
        logging.warning('No packages need to be updated.')
        return {}
    }

    // Backup workspace package.jsons
    const backupKey = await backupPackageJsons(config, context)
    logging.debug(`[Savepoint] Saving working tree (key: ${backupKey})`)

    let result: ChangesetSchema = {}

    try {
        // Apply releases, and update package.jsons
        const newVersions = await applyReleases(
            config,
            context,
            registryTags,
            versionStrategies,
        )

        // Publish (+ Git Tags)
        const workspacesToPublish = getWorkspacesToPublish(
            context,
            versionStrategies,
        )
        await publishPackages(
            config,
            context,
            versionStrategies,
            workspacesToPublish,
            registryUrl,
            newVersions,
        )

        // Write changeset
        result = await writeChangesetFile(
            config,
            context,
            newVersions,
            versionStrategies,
        )

        await prependChangelogFile(config, context, result)
    } catch (err) {
        logging.error(`Monodeploy failed`)
        logging.error(err)
    } finally {
        // Restore workspace package.jsons
        logging.debug(
            `[Savepoint] Restoring modified working tree (key: ${backupKey})`,
        )
        await restorePackageJsons(config, context, backupKey)
    }

    logging.info(`Monodeploy completed successfully`)
    return result
}

export default monodeploy
