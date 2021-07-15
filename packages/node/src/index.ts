import path from 'path'

import { prependChangelogFile, writeChangesetFile } from '@monodeploy/changelog'
import {
    backupPackageJsons,
    clearBackupCache,
    restorePackageJsons,
} from '@monodeploy/io'
import logging from '@monodeploy/logging'
import {
    commitPublishChanges,
    createReleaseGitTags,
    getWorkspacesToPublish,
    publishPackages,
} from '@monodeploy/publish'
import type {
    ChangesetSchema,
    MonodeployConfiguration,
    PackageStrategyMap,
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
} from '@monodeploy/versions'
import { Configuration, Project, StreamReport, Workspace } from '@yarnpkg/core'
import { npath } from '@yarnpkg/fslib'
import { AsyncSeriesHook } from 'tapable'

import getCompatiblePluginConfiguration from './utils/getCompatiblePluginConfiguration'
import {
    getFetchRegistryUrl,
    getPublishRegistryUrl,
} from './utils/getRegistryUrl'
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

    /* Initialize plugins */
    const hooks: PluginHooks = {
        onReleaseAvailable: new AsyncSeriesHook([
            'context',
            'config',
            'changeset',
        ]),
    }

    if (config.plugins?.length) {
        for (const plugin of config.plugins) {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const pluginModule = require(require.resolve(plugin, {
                paths: [cwd],
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
            workspace: workspace as Workspace,
            report,
            hooks,
        }

        logging.setDryRun(config.dryRun)

        logging.debug(`[Config] Using:`, {
            extras: JSON.stringify(config, null, 2),
            report,
        })

        const defaultPublishRegistryUrl = await getPublishRegistryUrl({
            config,
            context,
        })
        const defaultFetchRegistryUrl = await getFetchRegistryUrl({
            config,
            context,
        })
        logging.debug(
            `[Config] Default Registry Publish Url: ${defaultPublishRegistryUrl}`,
            { report },
        )
        logging.debug(
            `[Config] Default Registry Fetch Url: ${defaultFetchRegistryUrl}`,
            { report },
        )

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

        const versionStrategies: PackageStrategyMap = new Map([
            ...intentionalStrategies.entries(),
            ...implicitVersionStrategies.entries(),
        ])

        if (!versionStrategies.size) {
            logging.warning('No packages need to be updated.', { report })
        }

        // Backup workspace package.jsons
        let backupKey: string | undefined

        if (!config.dryRun) {
            backupKey = await backupPackageJsons({ config, context })
            logging.info(
                `[Savepoint] Saving working tree (key: ${backupKey})`,
                {
                    report,
                },
            )
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
                    })
                },
            )

            let createdGitTags: Map<string, string> | undefined

            await report.startTimerPromise(
                'Publishing Packages',
                { skipIfEmpty: false },
                async () => {
                    // Publish (+ Git Tags)
                    await publishPackages({
                        config,
                        context,
                        workspacesToPublish,
                        registryUrl: defaultPublishRegistryUrl,
                    })

                    if (config.git.tag) {
                        // Create tags
                        createdGitTags = await createReleaseGitTags({
                            config,
                            context,
                            versions: versionChanges.next,
                        })
                    }
                },
            )

            await report.startTimerPromise(
                'Updating Change Files',
                { skipIfEmpty: false },
                async () => {
                    // Write changeset
                    result = await writeChangesetFile({
                        config,
                        context,
                        previousTags: versionChanges.previous,
                        nextTags: versionChanges.next,
                        versionStrategies,
                        createdGitTags,
                    })

                    await prependChangelogFile({
                        config,
                        context,
                        changeset: result,
                        workspaces: workspacesToPublish,
                    })
                },
            )

            await report.startTimerPromise(
                'Committing Changes',
                { skipIfEmpty: true },
                async () => {
                    if (versionStrategies.size) {
                        await commitPublishChanges({
                            config,
                            context,
                        })
                    }
                },
            )

            await report.startTimerPromise(
                'Executing Release Hooks',
                { skipIfEmpty: true },
                async () =>
                    await hooks.onReleaseAvailable.promise(
                        context,
                        config,
                        result,
                    ),
            )

            logging.info(`Monodeploy completed successfully`, { report })
        } finally {
            await report.startTimerPromise(
                'Cleaning Up',
                { skipIfEmpty: false },
                async () => {
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
