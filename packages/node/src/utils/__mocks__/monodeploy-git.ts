/* eslint-disable @typescript-eslint/no-unused-vars */

import type { CommitMessage } from 'monodeploy-types'

const registry: {
    commits: CommitMessage[]
    filesModified: Map<string, string[]>
    tags: string[]
    pushedTags: string[]
    lastTaggedCommit?: string
} = {
    commits: [],
    filesModified: new Map(),
    tags: [],
    pushedTags: [],
    lastTaggedCommit: undefined,
}

export const _reset_ = (): void => {
    registry.commits = []
    registry.filesModified = new Map()
    registry.tags = []
    registry.pushedTags = []
    registry.lastTaggedCommit = undefined
}

export const _commitFiles_ = (
    sha: string,
    commit: string,
    files: string[],
): void => {
    registry.commits.push({ sha, body: commit })
    registry.filesModified.set(sha, registry.filesModified.get(sha) ?? [])
    registry.filesModified.get(sha).push(...files)
}

export const _getPushedTags_ = (): string[] => {
    return registry.pushedTags
}

export const gitResolveSha = async (
    ref: string,
    { cwd }: { cwd: string },
): Promise<string> => {
    return `sha:${ref}`
}

export const gitDiffTree = async (
    ref: string,
    { cwd }: { cwd: string },
): Promise<string> => {
    return (registry.filesModified.get(ref) ?? []).join('\n')
}

export const gitLog = async (
    from: string,
    to: string,
    { cwd, DELIMITER }: { cwd: string; DELIMITER: string },
): Promise<string> => {
    return registry.commits
        .map(commit => `${commit.sha}\n${commit.body}`)
        .join(`${DELIMITER}\n`)
}

export const gitTag = async (
    tag: string,
    { cwd }: { cwd: string },
): Promise<void> => {
    registry.tags.push(tag)
    registry.lastTaggedCommit =
        registry.commits[registry.commits.length - 1]?.sha
}

export const gitPush = async (
    tag: string,
    { cwd, remote }: { cwd: string; remote: string },
): Promise<void> => {
    if (!registry.tags.includes(tag)) {
        throw new Error(`Tag ${tag} does not exist.`)
    }
    registry.pushedTags.push(tag)
}

export const gitLastTaggedCommit = async ({
    cwd,
}: {
    cwd: string
}): Promise<string> => {
    if (!registry.lastTaggedCommit) {
        throw new Error('No tagged commit.')
    }
    return registry.lastTaggedCommit
}
