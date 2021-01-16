import yargs from 'yargs'

import monodeploy from './monodeploy'
import { gitResolveSha } from './utils/git'

interface ArgOutput {
    registryUrl?: string
    cwd?: string
    dryRun?: boolean
    gitBaseBranch?: string
    gitCommitSha?: string
    gitRemote?: string
    logLevel?: number
    conventionalChangelogConfig?: string
    changesetFilename?: string
    access?: string
}

const { argv } = yargs
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
    .option('access', {
        type: 'string',
        description:
            'Whether the package should be deployed as public or restricted (only applies to scoped packages)',
    })
    .demandCommand(0, 0)
    .strict()
    .wrap(yargs.terminalWidth()) as { argv: ArgOutput }

if (argv.logLevel !== undefined && argv.logLevel !== null) {
    process.env.MONODEPLOY_LOG_LEVEL = String(argv.logLevel)
}

const cwd = argv.cwd ?? process.cwd()

;(async () => {
    const config = {
        registryUrl: argv.registryUrl ?? undefined,
        cwd,
        dryRun: argv.dryRun ?? false,
        git: {
            baseBranch: argv.gitBaseBranch ?? 'origin/master',
            commitSha:
                argv.gitCommitSha ?? (await gitResolveSha('HEAD', { cwd })),
            remote: argv.gitRemote ?? 'origin',
        },
        conventionalChangelogConfig:
            argv.conventionalChangelogConfig ?? undefined,
        changesetFilename: argv.changesetFilename ?? undefined,
        access: argv.access ?? 'public',
    }

    try {
        await monodeploy(config)
    } catch (err) {
        console.error(err)
        process.exit(1)
    }
})()
