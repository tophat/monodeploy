import { Configuration, Project, Report, Workspace } from '@yarnpkg/core'
import { AsyncSeriesHook } from 'tapable'

export type RecursivePartial<T> = {
    [P in keyof T]?: T[P] extends Record<string, unknown>
        ? RecursivePartial<T[P]>
        : T[P]
}

export interface MonodeployConfiguration {
    cwd: string
    registryUrl?: string
    noRegistry: boolean
    dryRun: boolean
    git: {
        baseBranch: string
        commitSha: string
        remote: string
        push: boolean
        tag: boolean
    }
    conventionalChangelogConfig?:
        | string
        | {
              name: string
              [key: string]: unknown
          }
    changesetFilename?: string
    changelogFilename?: string
    changesetIgnorePatterns?: Array<string>
    forceWriteChangeFiles: boolean
    access?: string
    persistVersions: boolean
    autoCommit: boolean
    autoCommitMessage: string
    topological: boolean
    topologicalDev: boolean
    jobs: number
    maxConcurrentReads: number
    maxConcurrentWrites: number
    plugins?: Array<string>
    prerelease: boolean
    prereleaseId: string
    prereleaseNPMTag: string
}

export interface YarnContext {
    configuration: Configuration
    project: Project
    workspace: Workspace
    report: Report
    hooks?: PluginHooks
}

export interface PluginHooks {
    onReleaseAvailable: AsyncSeriesHook<
        [
            Readonly<YarnContext>,
            Readonly<MonodeployConfiguration>,
            Readonly<ChangesetSchema>,
        ],
        void
    >
}

export type CommitMessage = {
    sha: string
    body: string
}

export type PackageTagMap = Map<
    string,
    Record<string, string | undefined> & { latest: string }
>

export type PackageVersionMap = Map<string, string>

export type PackageStrategyType = 'major' | 'minor' | 'patch'

export type PackageStrategyMap = Map<
    string,
    { type: PackageStrategyType; commits: CommitMessage[] }
>

export type StrategyDeterminer = (commits: string[]) => Promise<number>

export interface ChangesetRecord {
    version: string
    previousVersion?: string | null
    changelog: string | null
    tag: string | null
    strategy?: PackageStrategyType | null
}

export interface ChangesetSchema {
    [packageName: string]: ChangesetRecord
}
