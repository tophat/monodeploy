import path from 'path'

import { prependChangelogFile, writeChangesetFile } from '@monodeploy/changelog'
import { backupPackageJsons, clearBackupCache, restorePackageJsons } from '@monodeploy/io'
import logging from '@monodeploy/logging'
import {
    commitPublishChanges,
    determineGitTags,
    getWorkspacesToPublish,
    publishPackages,
} from '@monodeploy/publish'
import type {
    ChangesetSchema,
    MonodeployConfiguration,
    PackageVersionMap,
    PluginHooks,
    RecursivePartial,
    YarnContext,
} from '@monodeploy/types'
import {
    applyReleases,
    getExplicitVersionStrategies,
    getImplicitVersionStrategies,
    getLatestPackageTags,
    mergeVersionStrategies,
} from '@monodeploy/versions'
import { Cache, Configuration, Project, StreamReport, Workspace } from '@yarnpkg/core'
import { npath } from '@yarnpkg/fslib'
import { AsyncSeriesHook } from 'tapable'

import getCompatiblePluginConfiguration from './utils/getCompatiblePluginConfiguration'
import { getFetchRegistryUrl } from './utils/getRegistryUrl'
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
    const configuration = await Configuration.find(cwd, getCompatiblePluginConfiguration())
    const foundProject = await Project.find(configuration, cwd)
    let { project } = foundProject
    const cache = await Cache.find(configuration)
    await project.restoreInstallState()

    /* Initialize plugins */
    const hooks: PluginHooks = {
        onReleaseAvailable: new AsyncSeriesHook(['context', 'config', 'changeset']),
    }

    if (config.plugins?.length) {
        for (const plugin of config.plugins) {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const pluginModule = require(require.resolve(plugin, {
                paths: [npath.fromPortablePath(cwd)],
            }))
            const pluginConstructor = pluginModule?.default ?? pluginModule
            pluginConstructor(hooks)
        }
    }

    let result: ChangesetSchema = {}

    const pipeline = async (report: StreamReport): Promise<void> => {
        const context: YarnContext = {
            configuration,
            project,
            workspace: foundProject.workspace as Workspace,
            report,
            hooks,
        }

        logging.setDryRun(config.dryRun)

        logging.debug('[Config] Using:', {
            extras: JSON.stringify(config, null, 2),
            report,
        })

        const defaultFetchRegistryUrl = await getFetchRegistryUrl({
            config,
            context,
        })
        logging.debug(`[Config] Default Registry Fetch Url: ${defaultFetchRegistryUrl}`, { report })

        // Fetch latest package versions for workspaces
        const registryTags = await getLatestPackageTags({
            config,
            context,
            registryUrl: defaultFetchRegistryUrl,
        })

        // Determine version bumps via commit messages
        const intentionalStrategies = await getExplicitVersionStrategies({
            config,
            context,
        })

        // Determine version bumps to dependent packages
        const implicitVersionStrategies = await getImplicitVersionStrategies({
            config,
            context,
            intentionalStrategies,
        })

        const { versionStrategies, workspaceGroups } = await mergeVersionStrategies({
            config,
            context,
            intentionalStrategies,
            implicitVersionStrategies,
        })

        if (!versionStrategies.size) {
            logging.warning('No packages need to be updated.', { report })
        }

        // Backup workspace package.jsons
        let backupKey: string | undefined

        if (!config.dryRun) {
            backupKey = await backupPackageJsons({ config, context })
            logging.info(`[Savepoint] Saving working tree (key: ${backupKey})`, {
                report,
            })
        }

        try {
            let workspacesToPublish: Set<Workspace>

            await report.startTimerPromise(
                'Fetching Workspace Information',
                { skipIfEmpty: false },
                async () => {
                    workspacesToPublish = await getWorkspacesToPublish({
                        context,
                        versionStrategies,
                    })
                },
            )

            let versionChanges: {
                next: PackageVersionMap
                previous: PackageVersionMap
            }

            let gitTags: Map<string, string> | undefined

            await report.startTimerPromise(
                'Patching Package Manifests',
                { skipIfEmpty: false },
                async () => {
                    // Apply releases, and update package.jsons
                    versionChanges = await applyReleases({
                        config,
                        context,
                        workspaces: workspacesToPublish,
                        registryTags,
                        versionStrategies,
                        workspaceGroups,
                    })
                },
            )

            if (config.git.tag) {
                await report.startTimerPromise(
                    'Determine Git Tags',
                    { skipIfEmpty: false },
                    async () => {
                        gitTags = await determineGitTags({
                            versions: versionChanges.next,
                        })
                    },
                )
            }

            await report.startTimerPromise(
                'Updating Change Files',
                { skipIfEmpty: false },
                async () => {
                    result = await writeChangesetFile({
                        config,
                        context,
                        previousTags: versionChanges.previous,
                        nextTags: versionChanges.next,
                        versionStrategies,
                        gitTags,
                        workspaceGroups,
                    })

                    await prependChangelogFile({
                        config,
                        context,
                        changeset: result,
                        workspaces: workspacesToPublish,
                    })
                },
            )

            // We publish to the registry before committing artifacts, because we use the
            // git tags (usually) to determine whether we should publish. So if publishing fails,
            // we don't want to have pushed the git tags to the repo, since otherwise we'd have to revert
            // those changes which are a hassle in an automated pipeline.
            await report.startTimerPromise(
                'Publishing Packages',
                { skipIfEmpty: false },
                async () => {
                    await publishPackages({
                        config,
                        context,
                        workspacesToPublish,
                    })
                },
            )

            // After patching the manifests, there may be an inconsistency between what's on
            // disk and what's in memory. We need to re-sync these states.
            project = (await Project.find(configuration, cwd)).project
            await project.restoreInstallState()

            if (config.persistVersions) {
                await report.startTimerPromise(
                    'Updating Project State',
                    { skipIfEmpty: false },
                    async () => {
                        logging.debug('Re-installing project to update lock file.', { report })
                        if (!config.dryRun) {
                            await project.install({
                                cache,
                                report,
                                immutable: false,
                            })
                        }
                    },
                )
            }

            await report.startTimerPromise(
                'Committing Changes',
                { skipIfEmpty: true },
                async () => {
                    if (!versionStrategies.size) return

                    await commitPublishChanges({
                        config,
                        context,
                        gitTags,
                    })
                },
            )

            await report.startTimerPromise(
                'Executing Release Hooks',
                { skipIfEmpty: true },
                async () => await hooks.onReleaseAvailable.promise(context, config, result),
            )

            logging.info('Monodeploy completed successfully', { report })
        } finally {
            await report.startTimerPromise('Cleaning Up', { skipIfEmpty: false }, async () => {
                // Nothing to clean up in dry run mode
                // (marked by backup key never being created)
                if (!backupKey) return

                if (!config.persistVersions) {
                    // Restore workspace package.jsons
                    logging.info(
                        `[Savepoint] Restoring modified working tree (key: ${backupKey})`,
                        { report },
                    )
                    await restorePackageJsons({ key: backupKey })
                }
                await clearBackupCache({ keys: [backupKey] })
            })
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
