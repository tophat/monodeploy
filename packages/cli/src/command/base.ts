import {
    type MonodeployConfiguration,
    type RecursivePartial,
    RegistryMode,
} from '@monodeploy/types'
import { npath, ppath } from '@yarnpkg/fslib'
import { Command, Option } from 'clipanion'
import * as t from 'typanion'

import readConfigFile from './readConfigFile'

export abstract class BaseCommand extends Command {
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
        validator: t.isEnum(['0', '1', '2', '3'] as const),
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

    async parseConfiguration(): Promise<{
        config: RecursivePartial<MonodeployConfiguration>
        configFromFile: RecursivePartial<Omit<MonodeployConfiguration, 'cwd'>> | undefined
    }> {
        const cwd = this.cwd

        const configFromFile = await readConfigFile(this.configFile, {
            cwd: cwd ? npath.toPortablePath(cwd) : ppath.cwd(),
            preset: this.preset,
        })

        const config: RecursivePartial<MonodeployConfiguration> = {
            logLevel: this.logLevel,
            registryUrl: this.registryUrl ?? configFromFile?.registryUrl ?? undefined,
            registryMode: this.registryMode ?? configFromFile?.registryMode ?? undefined,
            cwd: cwd ?? undefined,
            dryRun: this.dryRun ?? configFromFile?.dryRun ?? undefined,
            git: {
                baseBranch: this.gitBaseBranch ?? configFromFile?.git?.baseBranch ?? undefined,
                commitSha: this.gitCommitSha ?? configFromFile?.git?.commitSha ?? undefined,
                remote: this.gitRemote ?? configFromFile?.git?.remote ?? undefined,
                tag: this.gitTag === false ? this.gitTag : configFromFile?.git?.tag ?? undefined,
            },
            conventionalChangelogConfig:
                this.conventionalChangelogConfig ??
                configFromFile?.conventionalChangelogConfig ??
                undefined,
            changesetIgnorePatterns:
                this.changesetIgnorePatterns ??
                configFromFile?.changesetIgnorePatterns ??
                undefined,
            commitIgnorePatterns:
                this.commitIgnorePatterns ?? configFromFile?.commitIgnorePatterns ?? undefined,
            topological: this.topological ?? configFromFile?.topological,
            topologicalDev: this.topologicalDev ?? configFromFile?.topologicalDev,
            jobs: (this.jobs && this.jobs > 0 ? this.jobs : configFromFile?.jobs) ?? 0,
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

        return { config, configFromFile }
    }

    abstract execute(): Promise<number | void>
}
