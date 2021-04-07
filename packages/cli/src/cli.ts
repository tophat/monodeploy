import yargs from 'yargs'

import monodeploy from '@monodeploy/node'
import { MonodeployConfiguration, RecursivePartial } from '@monodeploy/types'

import readConfigFile from './readConfigFile'
import { ArgOutput } from './types'

const { argv } = yargs
    .option('config-file', {
        type: 'string',
        description: 'Config file from which to read monodeploy options',
    })
    .option('registry-url', {
        type: 'string',
        description: 'The URL of the registry to publish to',
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
        const configFromFile = configFilename
            ? await readConfigFile(configFilename, {
                  cwd: cwd ?? process.cwd(),
              })
            : {}

        const config: RecursivePartial<MonodeployConfiguration> = {
            registryUrl:
                argv.registryUrl ?? configFromFile.registryUrl ?? undefined,
            cwd: cwd ?? undefined,
            dryRun: argv.dryRun ?? configFromFile.dryRun ?? undefined,
            git: {
                baseBranch:
                    argv.gitBaseBranch ??
                    configFromFile.git?.baseBranch ??
                    undefined,
                commitSha:
                    argv.gitCommitSha ??
                    configFromFile.git?.commitSha ??
                    undefined,
                remote:
                    argv.gitRemote ?? configFromFile.git?.remote ?? undefined,
                push: argv.push ?? configFromFile.git?.push,
            },
            conventionalChangelogConfig:
                argv.conventionalChangelogConfig ??
                configFromFile.conventionalChangelogConfig ??
                undefined,
            changesetFilename:
                argv.changesetFilename ??
                configFromFile.changesetFilename ??
                undefined,
            changelogFilename:
                argv.prependChangelog ??
                configFromFile.changelogFilename ??
                undefined,
            forceWriteChangeFiles:
                argv.forceWriteChangeFiles ??
                configFromFile.forceWriteChangeFiles,
            access: argv.access ?? configFromFile.access ?? undefined,
            persistVersions:
                argv.persistVersions ?? configFromFile.persistVersions,
            topological: argv.topological ?? configFromFile.topological,
            topologicalDev:
                argv.topologicalDev ?? configFromFile.topologicalDev,
            jobs: argv.jobs ?? configFromFile.jobs,
        }

        await monodeploy(config)
    } catch (err) {
        console.error(err)
        process.exitCode = 1
    }
})()
