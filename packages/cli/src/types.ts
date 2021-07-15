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
    gitTag?: boolean
    logLevel?: number
    autoCommit?: boolean
    autoCommitMessage?: string
    conventionalChangelogConfig?: string
    changesetFilename?: string
    forceWriteChangeFiles?: boolean
    prependChangelog?: string
    access?: 'infer' | 'public' | 'restricted'
    push?: boolean
    persistVersions?: boolean
    topological?: boolean
    topologicalDev?: boolean
    jobs?: number
    maxConcurrentReads?: number
    maxConcurrentWrites?: number
    plugins?: Array<string>
    changesetIgnorePatterns?: Array<string>
    prerelease?: boolean
    prereleaseId?: string
    prereleaseNPMTag?: string
}

export type ConfigFile = RecursivePartial<Omit<MonodeployConfiguration, 'cwd'>>
