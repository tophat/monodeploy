import { ErrorsReported } from '@monodeploy/logging'
import monodeploy from '@monodeploy/node'
import { MonodeployConfiguration, RecursivePartial, RegistryMode } from '@monodeploy/types'
import { npath, ppath } from '@yarnpkg/fslib'
import { Command, Option } from 'clipanion'
import * as t from 'typanion'

import readConfigFile from './readConfigFile'

export class MonodeployCommand extends Command {
    preset = Option.String('--preset', {
        validator: t.isString(),
        description: 'Monodeploy config preset',
    })

    cwd = Option.String('--cwd', {
        validator: t.isString(),
        description: 'Working directory',
    })

    configFile = Option.String('--config-file', {
        validator: t.isString(),
        description: 'Config file from which to read monodeploy options',
    })

    registryUrl = Option.String('--registry-url', {
        validator: t.isString(),
        description: 'The URL of the registry to publish to',
    })

    registry = Option.Boolean('--registry', true, {
        description:
            'Whether to read and write to the npm-like registry (deprecated, use --registry-mode instead)',
    })

    registryMode = Option.String('--registry-mode', {
        description: 'The type of "registry" to use as the source of truth for package versions.',
        validator: t.isEnum(RegistryMode),
    })

    dryRun = Option.Boolean('--dry-run', {
        description: 'Dry run mode',
    })

    logLevel = Option.String('--log-level', {
        description: 'Log level',
        validator: t.isEnum(['0', '1', '2', '3']),
    })

    gitBaseBranch = Option.String('--git-base-branch', {
        validator: t.isString(),
        description: 'Git base branch to compare against to determine changes',
    })

    gitCommitSha = Option.String('--git-commit-sha', {
        validator: t.isString(),
        description: 'Git commit sha to compare against to determine changes',
    })

    gitRemote = Option.String('--git-remote', {
        validator: t.isString(),
        description: 'Git remote name to publish release tags to',
    })

    gitTag = Option.Boolean('--git-tag', true, {
        description: 'Whether to tag the commit with the published version using git',
    })

    conventionalChangelogConfig = Option.String('--conventional-changelog-config', {
        validator: t.isString(),
        description: 'Conventional changelog configuration to use to determine version strategies',
    })

    changesetFilename = Option.String('--changeset-filename', {
        validator: t.isString(),
        description: 'Changeset output filename',
    })

    applyChangeset = Option.Boolean('--apply-changeset', false, {
        description: 'Publishes using data from the changeset specified via --changeset-filename',
    })

    /**
     * @deprecated Will be removed in favour of --changelog-filename.
     */
    prependChangelog = Option.String('--prepend-changelog', {
        validator: t.isString(),
        description: 'Deprecated. Please use --changelog-filename.',
    })

    changelogFilename = Option.String('--changelog-filename', {
        validator: t.isString(),
        description: 'Changelog file to prepend changelog entries',
    })

    forceWriteChangeFiles = Option.Boolean('--force-write-change-files', {
        description:
            'Force changelog update and changeset writes even in dry run mode, good for previewing changes',
    })

    push = Option.Boolean('--push', { description: 'Whether to push git changes to remote' })

    persistVersions = Option.Boolean('--persist-versions', {
        description: 'Whether to persist package.json changes after publish',
    })

    access = Option.String('--access', {
        validator: t.isEnum(['infer', 'public', 'restricted'] as const),
        description:
            'Whether the package should be deployed as public or restricted (only applies to scoped packages)',
    })

    autoCommitMessage = Option.String('--auto-commit-message', {
        validator: t.isString(),
        description: 'Message to use when autocommiting the changelog and associated changes',
    })

    topological = Option.Boolean('--topological', {
        description: 'Whether to prepare workspaces in topological order',
    })

    topologicalDev = Option.Boolean('--topological-dev', {
        description:
            'Whether to prepare workspaces in topological order (taking dev dependencies into account)',
    })

    prerelease = Option.Boolean('--prerelease', {
        description: 'Whether to publish using a prerelease strategy',
    })

    prereleaseId = Option.String('--prerelease-id', {
        validator: t.isString(),
        description: 'The prerelease identifier when in prerelease mode.',
    })

    prereleaseNPMTag = Option.String('--prerelease-npm-tag', {
        validator: t.isString(),
        description: 'NPM dist tag to use for pre-release versions',
    })

    packageGroupManifestField = Option.String('--package-group-manifest-field', {
        validator: t.isString(),
        description: 'Manifest field to group packages by for grouped versioning.',
    })

    autoCommit = Option.Boolean('--auto-commit', {
        description:
            'Whether the changelog, package.json and lockfile changes should be autocommited to the active branch',
    })

    jobs = Option.String('--jobs', '0', {
        validator: t.isNumber(),
        description: 'Maximum number of tasks to run in parallel (set to 0 for unbounded)',
    })

    maxConcurrentWrites = Option.String('--max-concurrent-writes', {
        validator: t.isNumber(),
        description:
            'Maximum number of concurrent requests to make when writing to the registry (set to 0 for default)',
    })

    maxConcurrentReads = Option.String('--max-concurrent-reads', {
        validator: t.isNumber(),
        description:
            'Maximum number of concurrent requests to make when reading from the registry (set to 0 for default)',
    })

    plugins = Option.Array('--plugins', {
        description: 'Monodeploy plugins',
    })

    changesetIgnorePatterns = Option.Array('--changeset-ignore-patterns', {
        description: 'Globs to use in filtering out files when determining version bumps',
    })

    commitIgnorePatterns = Option.Array('--commit-ignore-patterns', {
        description:
            'Regular expression patterns to filter out commits from version strategy consideration',
    })

    async execute(): Promise<number | void> {
        try {
            const cwd = this.cwd

            const configFromFile = await readConfigFile(this.configFile, {
                cwd: cwd ? npath.toPortablePath(cwd) : ppath.cwd(),
                preset: this.preset,
            })

            const config: RecursivePartial<MonodeployConfiguration> = {
                registryUrl: this.registryUrl ?? configFromFile?.registryUrl ?? undefined,
                noRegistry: (!this.registry || configFromFile?.noRegistry) ?? undefined,
                registryMode: this.registryMode ?? configFromFile?.registryMode ?? undefined,
                cwd: cwd ?? undefined,
                dryRun: this.dryRun ?? configFromFile?.dryRun ?? undefined,
                git: {
                    baseBranch: this.gitBaseBranch ?? configFromFile?.git?.baseBranch ?? undefined,
                    commitSha: this.gitCommitSha ?? configFromFile?.git?.commitSha ?? undefined,
                    remote: this.gitRemote ?? configFromFile?.git?.remote ?? undefined,
                    push: this.push ?? configFromFile?.git?.push,
                    tag:
                        this.gitTag === false ? this.gitTag : configFromFile?.git?.tag ?? undefined,
                },
                conventionalChangelogConfig:
                    this.conventionalChangelogConfig ??
                    configFromFile?.conventionalChangelogConfig ??
                    undefined,
                changesetFilename:
                    this.changesetFilename ?? configFromFile?.changesetFilename ?? undefined,
                applyChangeset: this.applyChangeset ?? undefined,
                changesetIgnorePatterns:
                    this.changesetIgnorePatterns ??
                    configFromFile?.changesetIgnorePatterns ??
                    undefined,
                commitIgnorePatterns:
                    this.commitIgnorePatterns ?? configFromFile?.commitIgnorePatterns ?? undefined,
                changelogFilename:
                    this.changelogFilename ??
                    this.prependChangelog ??
                    configFromFile?.changelogFilename ??
                    undefined,
                forceWriteChangeFiles:
                    this.forceWriteChangeFiles ?? configFromFile?.forceWriteChangeFiles,
                access: this.access ?? configFromFile?.access ?? undefined,
                persistVersions: this.persistVersions ?? configFromFile?.persistVersions,
                topological: this.topological ?? configFromFile?.topological,
                topologicalDev: this.topologicalDev ?? configFromFile?.topologicalDev,
                jobs: (this.jobs && this.jobs > 0 ? this.jobs : configFromFile?.jobs) ?? 0,
                autoCommit: this.autoCommit ?? configFromFile?.autoCommit ?? undefined,
                autoCommitMessage:
                    this.autoCommitMessage ?? configFromFile?.autoCommitMessage ?? undefined,
                maxConcurrentReads:
                    (this.maxConcurrentReads && this.maxConcurrentReads > 0
                        ? this.maxConcurrentReads
                        : configFromFile?.maxConcurrentReads) ?? 0,
                maxConcurrentWrites:
                    (this.maxConcurrentWrites && this.maxConcurrentWrites > 0
                        ? this.maxConcurrentWrites
                        : configFromFile?.maxConcurrentWrites) ?? 0,
                plugins: this.plugins ?? configFromFile?.plugins ?? undefined,
                prerelease: this.prerelease ?? configFromFile?.prerelease ?? undefined,
                prereleaseId: this.prereleaseId ?? configFromFile?.prereleaseId ?? undefined,
                prereleaseNPMTag:
                    this.prereleaseNPMTag ?? configFromFile?.prereleaseNPMTag ?? undefined,
                packageGroupManifestField:
                    this.packageGroupManifestField ??
                    configFromFile?.packageGroupManifestField ??
                    undefined,
                packageGroups: configFromFile?.packageGroups,
            }

            if (this.logLevel !== undefined && this.logLevel !== null) {
                process.env.MONODEPLOY_LOG_LEVEL = String(this.logLevel)
            }

            await monodeploy(config)
            return 0
        } catch (err) {
            if (err instanceof ErrorsReported) {
                // We've already reported the error, return.
                return 1
            }

            this.context.stderr.write(`${err}\n`)
            if (process.env.DEBUG === 'monodeploy') {
                if (err instanceof Error) {
                    this.context.stderr.write(`${err.stack}\n`)
                }
            }
            return 1
        }
    }
}
