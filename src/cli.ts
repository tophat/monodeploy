import yargs from 'yargs'

import monodeploy from './monodeploy'

interface ArgOutput {
    registryUrl?: string
    cwd?: string
    dryRun?: boolean
    gitBaseBranch?: string
    gitCommitSha?: string
    logLevel?: number
    conventionalChangelogConfig?: string
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
    .option('log-level', {
        type: 'number',
        description: 'Log level',
    })
    .option('conventional-changelog-config', {
        type: 'string',
        description:
            'Conventional changelog configuration to use to determine version strategies',
    })
    .demandCommand(0, 0)
    .strict()
    .wrap(yargs.terminalWidth()) as { argv: ArgOutput }

if (argv.logLevel !== undefined && argv.logLevel !== null) {
    process.env.MONODEPLOY_LOG_LEVEL = String(argv.logLevel)
}

monodeploy({
    registryUrl: argv.registryUrl ?? undefined,
    cwd: argv.cwd ?? process.cwd(),
    dryRun: argv.dryRun ?? false,
    git: {
        baseBranch: argv.gitBaseBranch ?? 'origin/master',
        commitSha: argv.gitCommitSha ?? 'HEAD',
    },
    conventionalChangelogConfig: argv.conventionalChangelogConfig ?? undefined,
}).catch(err => {
    console.error(err)
    process.exit(1)
})
