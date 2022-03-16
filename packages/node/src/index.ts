import path from 'path'

import { prependChangelogFile } from '@monodeploy/changelog'
import {
    backupPackageJsons,
    clearBackupCache,
    patchPackageJsons,
    restorePackageJsons,
} from '@monodeploy/io'
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
    applyVersionStrategies,
    getExplicitVersionStrategies,
    getImplicitVersionStrategies,
    getLatestPackageTags,
    mergeVersionStrategies,
} from '@monodeploy/versions'
import { Cache, Configuration, Project, StreamReport, Workspace } from '@yarnpkg/core'
import { npath } from '@yarnpkg/fslib'
import { AsyncSeriesHook } from 'tapable'

import { generateChangeset } from './utils/generateChangeset'
import { getCompatiblePluginConfiguration } from './utils/getCompatiblePluginConfiguration'
import { getGitTagsFromChangeset } from './utils/getGitTagsFromChangeset'
import { mergeDefaultConfig } from './utils/mergeDefaultConfig'
// import { readChangesetFile } from './utils/readChangesetFile'
import { writeChangesetFile } from './utils/writeChangesetFile'

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
    const { project } = foundProject
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

    let changeset: ChangesetSchema = {}

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

        if (config.applyChangeset) {
            throw new Error(
                '[Pre-release] Running monodeploy from a changeset file is NOT supported yet. Exiting early.',
            )
            // changeset = await readChangesetFile({ config })
        }

        // Fetch latest package versions for workspaces
        const registryTags = await getLatestPackageTags({
            config,
            context,
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

        // Backup workspace package.jsons
        let backupKey: string | undefined

        if (!config.dryRun) {
            backupKey = await backupPackageJsons({ config, context })
        }

        let versionChanges: {
            next: PackageVersionMap
            previous: PackageVersionMap
        }

        let gitTags: Map<string, string> | undefined

        await report.startTimerPromise(
            'Determine New Versions',
            { skipIfEmpty: false },
            async () => {
                versionChanges = await applyVersionStrategies({
                    config,
                    context,
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
                        workspaceGroups,
                    })
                },
            )
        }

        await report.startTimerPromise('Generating Changeset', { skipIfEmpty: false }, async () => {
            changeset = await generateChangeset({
                config,
                context,
                previousTags: versionChanges.previous,
                nextTags: versionChanges.next,
                versionStrategies,
                gitTags,
                workspaceGroups,
            })
            await writeChangesetFile({ config, context, changeset })
        })

        let workspaces: Set<Workspace>

        await report.startTimerPromise(
            'Fetching Workspace Information',
            { skipIfEmpty: false },
            async () => {
                workspaces = await getWorkspacesToPublish({
                    context,
                    changeset,
                })
            },
        )

        await new Promise<void>((resolve) => {
            if (!workspaces.size) {
                logging.warning('No packages need to be updated.', { report })
            }
            resolve()
        })

        await report.startTimerPromise('Updating Changelog', { skipIfEmpty: false }, async () => {
            await prependChangelogFile({
                config,
                context,
                changeset,
                workspaces,
            })
        })

        try {
            // Update package.jsons (the main destructive action which requires the backup)
            await report.startTimerPromise(
                'Patching Package Manifests',
                { skipIfEmpty: false },
                async () => {
                    await patchPackageJsons({
                        config,
                        context,
                        workspaces,
                        registryTags: new Map<string, string>([
                            ...versionChanges.previous.entries(),
                            ...versionChanges.next.entries(),
                        ]),
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
                        workspaces,
                    })
                },
            )

            await new Promise<void>((resolve) => {
                if (workspaces.size) {
                    // After patching the manifests, there may be an inconsistency between what's on
                    // disk and what's in memory. We need to re-sync these states.
                    Project.find(configuration, cwd)
                        .then(({ project }) => project.restoreInstallState())
                        .then(resolve)
                } else {
                    resolve()
                }
            })

            if (config.persistVersions) {
                await report.startTimerPromise(
                    'Updating Project State',
                    { skipIfEmpty: false },
                    async () => {
                        if (!workspaces.size) return

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
                    if (!workspaces.size) return

                    await commitPublishChanges({
                        config,
                        context,
                        gitTags: getGitTagsFromChangeset(changeset),
                    })
                },
            )

            await report.startTimerPromise(
                'Executing Release Hooks',
                { skipIfEmpty: true },
                async () => await hooks.onReleaseAvailable.promise(context, config, changeset),
            )

            logging.info('Monodeploy completed successfully', { report })
        } finally {
            await report.startTimerPromise('Cleaning Up', { skipIfEmpty: false }, async () => {
                // Nothing to clean up in dry run mode
                // (marked by backup key never being created)
                if (!backupKey) return

                if (!config.persistVersions) {
                    // Restore workspace package.jsons
                    await restorePackageJsons({ report, key: backupKey })
                }
                await clearBackupCache({ report, keys: [backupKey] })
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

    return changeset
}

export default monodeploy
