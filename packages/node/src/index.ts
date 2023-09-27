import path from 'path'

import { prependChangelogFile } from '@monodeploy/changelog'
import {
    backupPackageJsons,
    clearBackupCache,
    patchPackageJsons,
    restorePackageJsons,
} from '@monodeploy/io'
import logging, { ErrorsReported, InvariantError } from '@monodeploy/logging'
import {
    createPublishCommit,
    determineGitTags,
    getWorkspacesToPublish,
    publishPackages,
    pushPublishCommit,
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
import { Cache, Configuration, Project, StreamReport, type Workspace } from '@yarnpkg/core'
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
    if (baseConfig.logLevel !== undefined && baseConfig.logLevel !== null) {
        process.env.MONODEPLOY_LOG_LEVEL = String(baseConfig.logLevel)
    }

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
        for (const pluginEntry of config.plugins) {
            const [plugin, pluginOptions] =
                typeof pluginEntry === 'string' ? [pluginEntry] : pluginEntry

            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const pluginModule = require(
                require.resolve(plugin, {
                    paths: [npath.fromPortablePath(cwd)],
                }),
            )
            const pluginConstructor = pluginModule?.default ?? pluginModule
            pluginConstructor(hooks, pluginOptions)
        }
    }

    let changeset: ChangesetSchema = {}

    const pipeline = async (report: StreamReport): Promise<void> => {
        if (!foundProject.workspace) throw new InvariantError('No workspace found.')
        const context: YarnContext = {
            configuration,
            project,
            workspace: foundProject.workspace,
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

        let workspaces = new Set<Workspace>()

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

        if (!workspaces) {
            throw new Error(
                'Workspaces invariant violation. If you are seeing this message, a critical error ' +
                    'has occurred. Please report this to the GitHub issue tracker.',
            )
        }

        await new Promise<void>((resolve) => {
            if (!workspaces.size) {
                logging.warning('No packages need to be updated.', { report })
            }
            resolve()
        })

        // Backup workspace package.jsons
        let backupKey: string | undefined

        if (!config.dryRun) {
            backupKey = await backupPackageJsons({ config, context })
        }

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

            if (workspaces.size) {
                // After patching the manifests, there may be an inconsistency between what's on
                // disk and what's in memory. We need to re-sync these states.
                project = (await Project.find(configuration, cwd)).project
                await project.restoreInstallState()
            }

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

            let publishCommitSha: string | undefined
            const restoredGitTags = getGitTagsFromChangeset(changeset)

            await report.startTimerPromise(
                'Updating Changelog',
                { skipIfEmpty: false },
                async () => {
                    await prependChangelogFile({
                        config,
                        context,
                        changeset,
                        workspaces,
                        forceRefreshChangelogs: config.autoCommit && config.git.push,
                    })
                },
            )

            await report.startTimerPromise(
                'Committing Changes',
                { skipIfEmpty: true },
                async () => {
                    if (!workspaces.size) return

                    const publishCommit = await createPublishCommit({
                        config,
                        context,
                        gitTags: restoredGitTags,
                    })
                    publishCommitSha = publishCommit?.headSha
                },
            )

            if (!config.dryRun) {
                // When not in dry run mode, we run an extra git push --dry-run
                // prior to publishing packages. This is meant to stop the pipeline
                // when a git issue is detected, before corrupting the npm registry.
                await report.startTimerPromise(
                    'Validating Git Config',
                    { skipIfEmpty: true },
                    async () => {
                        if (!workspaces.size) return

                        await pushPublishCommit({
                            config,
                            context,
                            gitTags: restoredGitTags,
                            dryRun: true,
                        })
                    },
                )
            }

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
                        publishCommitSha,
                    })
                },
            )

            await report.startTimerPromise('Pushing Commit', { skipIfEmpty: true }, async () => {
                if (!workspaces.size) return

                if (config.dryRun) {
                    // Ideally we use the git --dry-run commands in dry run, however this would be a
                    // breaking change for projects that rely on dryRun to generate Pull Request change previews.
                    // Once https://github.com/tophat/monodeploy/issues/493 is merged, we'll have a path forward for
                    // the preview use case and can then remove the "if (!config.dryRun)" conditional as part of a
                    // breaking change.
                    if (config.git.push) {
                        logging.info('[Publish] Pushing publish commit', {
                            report: context?.report,
                        })
                    }
                    return
                }

                await pushPublishCommit({
                    config,
                    context,
                    gitTags: restoredGitTags,
                })
            })

            await report.startTimerPromise(
                'Executing Release Hooks',
                { skipIfEmpty: true },
                async () =>
                    void (await hooks.onReleaseAvailable.promise(context, config, changeset)),
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
        throw new ErrorsReported()
    }

    return changeset
}

export default monodeploy
