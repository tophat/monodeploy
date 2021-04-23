import path from 'path'

import { Configuration, Project, StreamReport, Workspace } from '@yarnpkg/core'
import { npath } from '@yarnpkg/fslib'

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
    PackageTagMap,
    RecursivePartial,
    YarnContext,
} from '@monodeploy/types'
import {
    applyReleases,
    getExplicitVersionStrategies,
    getImplicitVersionStrategies,
    getLatestPackageTags,
} from '@monodeploy/versions'

import getCompatiblePluginConfiguration from './utils/getCompatiblePluginConfiguration'
import getRegistryUrl from './utils/getRegistryUrl'
import mergeDefaultConfig from './utils/mergeDefaultConfig'

const monodeploy = async (
    baseConfig: RecursivePartial<MonodeployConfiguration>,
): Promise<ChangesetSchema> => {
    const config: MonodeployConfiguration = await mergeDefaultConfig(baseConfig)

    if (config.cwd === typeof undefined) {
        throw new Error('Invalid cwd.')
    }

    /**
     * In plumbing mode, we don't want to print out any unusable logs,
     * as it would interfere with the data intended for piping into other programs.
     */
    const plumbingMode = config.changesetFilename === '-'

    const cwd = npath.toPortablePath(path.resolve(process.cwd(), config.cwd))
    const configuration = await Configuration.find(
        cwd,
        getCompatiblePluginConfiguration(),
    )
    const { project, workspace } = await Project.find(configuration, cwd)
    await project.restoreInstallState()

    let result: ChangesetSchema = {}

    const pipeline = async (report: StreamReport): Promise<void> => {
        const context: YarnContext = {
            configuration,
            project,
            workspace: workspace as Workspace,
            report,
        }

        logging.setDryRun(config.dryRun)

        logging.debug(`Starting monodeploy with config:`, {
            extras: JSON.stringify(config, null, 2),
            report,
        })

        // Determine registry
        const registryUrl = config.noRegistry
            ? null
            : await getRegistryUrl(config, context)
        logging.debug(`[Config] Registry Url: ${String(registryUrl)}`, {
            report,
        })

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
            logging.warning('No packages need to be updated.', { report })
            return
        }

        // Backup workspace package.jsons
        const backupKey = await backupPackageJsons(config, context)
        logging.debug(`[Savepoint] Saving working tree (key: ${backupKey})`, {
            report,
        })

        try {
            let workspacesToPublish: Set<Workspace>

            await report.startTimerPromise(
                'Fetching Workspace Information',
                { skipIfEmpty: false },
                async () => {
                    workspacesToPublish = await getWorkspacesToPublish(
                        context,
                        versionStrategies,
                    )
                },
            )

            let newVersions: PackageTagMap

            await report.startTimerPromise(
                'Patching Package Manifests',
                { skipIfEmpty: false },
                async () => {
                    // Apply releases, and update package.jsons
                    newVersions = await applyReleases(
                        config,
                        context,
                        workspacesToPublish,
                        registryTags,
                        versionStrategies,
                    )
                },
            )

            await report.startTimerPromise(
                'Publishing Packages',
                { skipIfEmpty: false },
                async () => {
                    // Publish (+ Git Tags)
                    await publishPackages(
                        config,
                        context,
                        workspacesToPublish,
                        registryUrl,
                        newVersions,
                    )
                },
            )

            await report.startTimerPromise(
                'Updating Change Files',
                { skipIfEmpty: false },
                async () => {
                    // Write changeset
                    result = await writeChangesetFile(
                        config,
                        context,
                        registryTags, // old versions
                        newVersions,
                        versionStrategies,
                    )

                    await prependChangelogFile(config, context, result)
                },
            )

            logging.info(`Monodeploy completed successfully`, { report })
        } finally {
            await report.startTimerPromise(
                'Cleaning Up',
                { skipIfEmpty: false },
                async () => {
                    if (!config.persistVersions) {
                        // Restore workspace package.jsons
                        logging.debug(
                            `[Savepoint] Restoring modified working tree (key: ${backupKey})`,
                            { report },
                        )
                        await restorePackageJsons(config, context, backupKey)
                    }
                    await clearBackupCache([backupKey])
                },
            )
        }
    }

    const report = await StreamReport.start(
        {
            configuration,
            stdout: process.stdout,
            includeLogs: !plumbingMode,
            includeInfos: !plumbingMode,
            includeWarnings: !plumbingMode,
            includeFooter: !plumbingMode,
        },
        pipeline,
    )

    if (report.hasErrors()) {
        throw new Error('Monodeploy failed')
    }

    return result
}

export default monodeploy
