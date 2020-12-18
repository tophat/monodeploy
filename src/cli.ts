import yargs from 'yargs'

import monodeploy from './monodeploy'

interface ArgOutput {
    registryUrl?: string
    cwd?: string
    dryRun?: boolean
    gitBaseBranch?: string
    gitCommitSha?: string
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
    .option('git-commit-branch', {
        type: 'string',
        description: 'Git commit sha to compare against to determine changes',
    })
    .demandCommand(0, 0)
    .strict()
    .wrap(yargs.terminalWidth()) as { argv: ArgOutput }

monodeploy({
    registryUrl: argv.registryUrl ?? undefined,
    cwd: argv.cwd ?? process.cwd(),
    dryRun: argv.dryRun ?? false,
    git: {
        baseBranch: argv.gitBaseBranch ?? 'origin/master',
        commitSha: argv.gitCommitSha ?? 'HEAD',
    },
}).catch(err => {
    console.error(err)
    process.exit(1)
})