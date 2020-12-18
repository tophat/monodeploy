import { Configuration, Project, Workspace } from '@yarnpkg/core'

export interface MonodeployConfiguration {
    cwd: string
    registryUrl?: string
    dryRun: boolean
    git: {
        baseBranch: string
        commitSha: string
    }
}

export interface YarnContext {
    configuration: Configuration
    project: Project
    workspace: Workspace
}

export type PackageTagMap = { [packageName: string]: string }

export type PackageVersionBumpType = 'major' | 'minor' | 'patch'

export type PackageVersionBumps = {
    [packageName: string]: PackageVersionBumpType
}
