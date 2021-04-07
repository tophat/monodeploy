import { MonodeployConfiguration, RecursivePartial } from '@monodeploy/types'

export interface ArgOutput {
    configFile?: string
    registryUrl?: string
    registry?: boolean
    cwd?: string
    dryRun?: boolean
    gitBaseBranch?: string
    gitCommitSha?: string
    gitRemote?: string
    logLevel?: number
    conventionalChangelogConfig?: string
    changesetFilename?: string
    forceWriteChangeFiles?: boolean
    prependChangelog?: string
    access?: string
    push?: boolean
    persistVersions?: boolean
    topological?: boolean
    topologicalDev?: boolean
    jobs?: number
}

export type ConfigFile = RecursivePartial<MonodeployConfiguration>
