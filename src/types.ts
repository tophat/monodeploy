import { Configuration, Project, Workspace } from '@yarnpkg/core'

export interface MonodeployConfiguration {
    cwd: string
    registryUrl?: string
    dryRun: boolean
    git: {
        baseBranch: string
        commitSha: string
    }
    conventionalChangelogConfig?: string
}

export interface YarnContext {
    configuration: Configuration
    project: Project
    workspace: Workspace
}

export type PackageTagMap = Map<string, string>

export type PackageStrategyType = 'major' | 'minor' | 'patch'

export type PackageStrategyMap = Map<string, PackageStrategyType>
