import { Configuration, Project, Workspace } from '@yarnpkg/core'

export type RecursivePartial<T> = {
    [P in keyof T]?: T[P] extends Record<string, unknown>
        ? RecursivePartial<T[P]>
        : T[P]
}

export interface MonodeployConfiguration {
    cwd: string
    registryUrl?: string
    dryRun: boolean
    git: {
        baseBranch: string
        commitSha: string
        remote: string
        push: boolean
    }
    conventionalChangelogConfig?: string
    changesetFilename?: string
    changelogFilename?: string
    forceWriteChangeFiles: boolean
    access: string
    persistVersions: boolean
    topological: boolean
    topologicalDev: boolean
    jobs: number
}

export interface YarnContext {
    configuration: Configuration
    project: Project
    workspace: Workspace
}

export type CommitMessage = {
    sha: string
    body: string
}

export type PackageTagMap = Map<string, string>

export type PackageStrategyType = 'major' | 'minor' | 'patch'

export type PackageStrategyMap = Map<
    string,
    { type: PackageStrategyType; commits: CommitMessage[] }
>

export type StrategyDeterminer = (commits: string[]) => Promise<number>

export interface ChangesetSchema {
    [version: string]: { version: string; changelog: string | null }
}
