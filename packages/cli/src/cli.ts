import monodeploy from '@monodeploy/node'
import { MonodeployConfiguration, RecursivePartial } from '@monodeploy/types'
import yargs from 'yargs'

import readConfigFile from './readConfigFile'
import { ArgOutput, ConfigFile } from './types'

const { argv } = yargs
    .option('config-file', {
        type: 'string',
        description: 'Config file from which to read monodeploy options',
    })
    .option('registry-url', {
        type: 'string',
        description: 'The URL of the registry to publish to',
    })
    .option('registry', {
        type: 'boolean',
        default: true,
        description: 'Whether to read and write to the npm-like registry',
    })
    .option('cwd', {
        type: 'string',
        description: 'Working directory',
    })
    .option('dry-run', {
        type: 'boolean',
        description: 'Dry run mode',
    })
    .option('git-base-branch', {
        type: 'string',
        description: 'Git base branch to compare against to determine changes',
    })
    .option('git-commit-sha', {
        type: 'string',
        description: 'Git commit sha to compare against to determine changes',
    })
    .option('git-remote', {
        type: 'string',
        description: 'Git remote name to publish release tags to',
    })
    .option('git-tag', {
        type: 'boolean',
        default: true,
        description:
            'Whether to tag the commit with the published version using git',
    })
    .option('log-level', {
        type: 'number',
        description: 'Log level',
    })
    .option('conventional-changelog-config', {
        type: 'string',
        description:
            'Conventional changelog configuration to use to determine version strategies',
    })
    .option('changeset-filename', {
        type: 'string',
        description: 'Changeset output filename',
    })
    .option('prepend-changelog', {
        type: 'string',
        description: 'Changelog file to prepend changelog entries',
    })
    .option('force-write-change-files', {
        type: 'boolean',
        description:
            'Force changelog update and changeset writes even in dry run mode, good for previewing changes',
        default: false,
    })
    .option('push', {
        type: 'boolean',
        description: 'Whether to push git changes to remote',
        default: false,
    })
    .option('persist-versions', {
        type: 'boolean',
        description: 'Whether to persist package.json changes after publish',
        default: false,
    })
    .option('access', {
        type: 'string',
        description:
            'Whether the package should be deployed as public or restricted (only applies to scoped packages)',
    })
    .option('auto-commit', {
        type: 'boolean',
        description:
            'Whether the changelog, package.json and lockfile changes should be autocommited to the active branch',
        default: false,
    })
    .option('auto-commit-message', {
        type: 'string',
        description:
            'Message to use when autocommiting the changelog and associated changes',
    })
    .option('topological', {
        type: 'boolean',
        description: 'Whether to prepare workspaces in topological order',
        default: false,
    })
    .option('topological-dev', {
        type: 'boolean',
        description:
            'Whether to prepare workspaces in topological order (taking dev dependencies into account)',
        default: false,
    })
    .option('jobs', {
        type: 'number',
        description:
            'Maximum number of tasks to run in parallel (set to 0 for unbounded)',
        default: 0,
    })
    .option('max-concurrent-writes', {
        type: 'number',
        description:
            'Maximum number of concurrent requests to make when writing to the registry (set to 0 for default)',
    })
    .option('max-concurrent-reads', {
        type: 'number',
        description:
            'Maximum number of concurrent requests to make when reading from the registry (set to 0 for default)',
    })
    .option('plugins', {
        type: 'array',
        description: 'Monodeploy plugins',
    })
    .option('changeset-ignore-patterns', {
        type: 'array',
        description:
            'Globs to use in filtering out files when determining version bumps',
    })
    .demandCommand(0, 0)
    .strict()
    .wrap(yargs.terminalWidth()) as { argv: ArgOutput }

if (argv.logLevel !== undefined && argv.logLevel !== null) {
    process.env.MONODEPLOY_LOG_LEVEL = String(argv.logLevel)
}

// eslint-disable-next-line @typescript-eslint/no-extra-semi
;(async () => {
    try {
        const cwd = argv.cwd

        const configFilename = argv.configFile
        const configFromFile: ConfigFile | null = configFilename
            ? await readConfigFile(configFilename, {
                  cwd: cwd ?? process.cwd(),
              })
            : null

        const config: RecursivePartial<MonodeployConfiguration> = {
            registryUrl:
                argv.registryUrl ?? configFromFile?.registryUrl ?? undefined,
            noRegistry:
                (!argv.registry || configFromFile?.noRegistry) ?? undefined,
            cwd: cwd ?? undefined,
            dryRun: argv.dryRun ?? configFromFile?.dryRun ?? undefined,
            git: {
                baseBranch:
                    argv.gitBaseBranch ??
                    configFromFile?.git?.baseBranch ??
                    undefined,
                commitSha:
                    argv.gitCommitSha ??
                    configFromFile?.git?.commitSha ??
                    undefined,
                remote:
                    argv.gitRemote ?? configFromFile?.git?.remote ?? undefined,
                push: argv.push || configFromFile?.git?.push,
                tag:
                    argv.gitTag === false
                        ? argv.gitTag
                        : configFromFile?.git?.tag ?? undefined,
            },
            conventionalChangelogConfig:
                argv.conventionalChangelogConfig ??
                configFromFile?.conventionalChangelogConfig ??
                undefined,
            changesetFilename:
                argv.changesetFilename ??
                configFromFile?.changesetFilename ??
                undefined,
            changesetIgnorePatterns:
                argv.changesetIgnorePatterns ??
                configFromFile?.changesetIgnorePatterns ??
                undefined,
            changelogFilename:
                argv.prependChangelog ??
                configFromFile?.changelogFilename ??
                undefined,
            forceWriteChangeFiles:
                argv.forceWriteChangeFiles ||
                configFromFile?.forceWriteChangeFiles,
            access: argv.access ?? configFromFile?.access ?? undefined,
            persistVersions:
                argv.persistVersions || configFromFile?.persistVersions,
            topological: argv.topological || configFromFile?.topological,
            topologicalDev:
                argv.topologicalDev || configFromFile?.topologicalDev,
            jobs:
                (argv.jobs && argv.jobs > 0
                    ? argv.jobs
                    : configFromFile?.jobs) ?? 0,
            autoCommit:
                (argv.autoCommit || configFromFile?.autoCommit) ?? undefined,
            autoCommitMessage:
                argv.autoCommitMessage ??
                configFromFile?.autoCommitMessage ??
                undefined,
            maxConcurrentReads:
                (argv.maxConcurrentReads && argv.maxConcurrentReads > 0
                    ? argv.maxConcurrentReads
                    : configFromFile?.maxConcurrentReads) ?? 0,
            maxConcurrentWrites:
                (argv.maxConcurrentWrites && argv.maxConcurrentWrites > 0
                    ? argv.maxConcurrentWrites
                    : configFromFile?.maxConcurrentWrites) ?? 0,
            plugins: argv.plugins ?? configFromFile?.plugins ?? undefined,
        }

        await monodeploy(config)
    } catch (err) {
        console.error(err)
        process.exitCode = 1
    }
})()
