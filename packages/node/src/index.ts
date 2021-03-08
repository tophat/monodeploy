import path from 'path'

import { getPluginConfiguration } from '@yarnpkg/cli'
import { Configuration, Project, Workspace } from '@yarnpkg/core'
import { PortablePath } from '@yarnpkg/fslib'

import { prependChangelogFile, writeChangesetFile } from '@monodeploy/changelog'
import {
    backupPackageJsons,
    clearBackupCache,
    restorePackageJsons,
} from '@monodeploy/io'
import logging from '@monodeploy/logging'
import { getWorkspacesToPublish, publishPackages } from '@monodeploy/publish'
import type {
    ChangesetSchema,
    MonodeployConfiguration,
    PackageStrategyMap,
    RecursivePartial,
    YarnContext,
} from '@monodeploy/types'
import {
    applyReleases,
    getExplicitVersionStrategies,
    getImplicitVersionStrategies,
    getLatestPackageTags,
} from '@monodeploy/versions'

import getRegistryUrl from './utils/getRegistryUrl'
import mergeDefaultConfig from './utils/mergeDefaultConfig'

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
    const configuration = await Configuration.find(
        cwd,
        getPluginConfiguration(),
    )
    const { project, workspace } = await Project.find(configuration, cwd)
    await project.restoreInstallState()

    const context: YarnContext = {
        configuration,
        project,
        workspace: workspace as Workspace,
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
        const workspacesToPublish = getWorkspacesToPublish(
            context,
            versionStrategies,
        )

        // Apply releases, and update package.jsons
        const newVersions = await applyReleases(
            config,
            context,
            workspacesToPublish,
            registryTags,
            versionStrategies,
        )

        // Publish (+ Git Tags)
        await publishPackages(
            config,
            context,
            workspacesToPublish,
            registryUrl,
            newVersions,
        )

        // Write changeset
        result = await writeChangesetFile(
            config,
            context,
            registryTags, // old versions
            newVersions,
            versionStrategies,
        )

        await prependChangelogFile(config, context, result)
        logging.info(`Monodeploy completed successfully`)
    } catch (err) {
        logging.error(`Monodeploy failed`)
        throw err
    } finally {
        if (!config.persistVersions) {
            // Restore workspace package.jsons
            logging.debug(
                `[Savepoint] Restoring modified working tree (key: ${backupKey})`,
            )
            await restorePackageJsons(config, context, backupKey)
        }
        await clearBackupCache([backupKey])
    }

    return result
}

export default monodeploy
