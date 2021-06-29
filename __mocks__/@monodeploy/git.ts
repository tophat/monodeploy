/* eslint-disable @typescript-eslint/no-unused-vars */

import type {
    CommitMessage,
    MonodeployConfiguration,
    YarnContext,
} from '@monodeploy/types'

const actualMonodeployGit = jest.requireActual('@monodeploy/git')

const registry: {
    commits: CommitMessage[]
    filesModified: Map<string, string[]>
    tags: string[]
    pushedTags: string[]
    lastTaggedCommit?: string
    pushedCommits: string[]
    stagedFiles: string[]
} = {
    commits: [],
    filesModified: new Map(),
    tags: [],
    pushedTags: [],
    pushedCommits: [],
    lastTaggedCommit: undefined,
    stagedFiles: [],
}

const _reset_ = (): void => {
    registry.commits = []
    registry.filesModified = new Map()
    registry.tags = []
    registry.pushedTags = []
    registry.pushedCommits = []
    registry.lastTaggedCommit = undefined
    registry.stagedFiles = []
}

const _commitFiles_ = (sha: string, commit: string, files: string[]): void => {
    registry.commits.push({ sha, body: commit })
    registry.filesModified.set(sha, registry.filesModified.get(sha) ?? [])
    registry.filesModified.get(sha)!.push(...files)
}

const _getPushedTags_ = (): string[] => {
    return registry.pushedTags
}

const _getTags_ = (): string[] => {
    return registry.tags
}

const _getRegistry_ = (): typeof registry => registry

const gitResolveSha = async (
    ref: string,
    { cwd, context }: { cwd: string; context: YarnContext },
): Promise<string> => {
    return `sha:${ref}`
}

const gitDiffTree = async (
    ref: string,
    { cwd, context }: { cwd: string; context: YarnContext },
): Promise<string> => {
    return (registry.filesModified.get(ref) ?? []).join('\n')
}

const gitLog = async (
    from: string,
    to: string,
    {
        cwd,
        DELIMITER,
        context,
    }: { cwd: string; DELIMITER: string; context: YarnContext },
): Promise<string> => {
    return registry.commits
        .map((commit) => `${commit.sha}\n${commit.body}`)
        .join(`${DELIMITER}\n`)
}

const gitTag = async (
    tag: string,
    { cwd, context }: { cwd: string; context: YarnContext },
): Promise<void> => {
    registry.tags.push(tag)
    registry.lastTaggedCommit =
        registry.commits[registry.commits.length - 1]?.sha
}

const gitPushTags = async ({
    cwd,
    remote,
    context,
}: {
    cwd: string
    remote: string
    context: YarnContext
}): Promise<void> => {
    registry.pushedTags = Array.from(
        new Set([...registry.pushedTags, ...registry.tags]),
    )
}

const gitPull = async ({
    cwd,
    remote,
    context,
}: {
    cwd: string
    remote: string
    context?: YarnContext
}): Promise<void> => {
    /* do nothing */
}

const gitPush = async ({
    cwd,
    remote,
    context,
}: {
    cwd: string
    remote: string
    context: YarnContext
}): Promise<void> => {
    for (const commit of registry.commits) {
        registry.pushedCommits.push(commit.sha)
    }
}

export const gitAdd = async (
    paths: string[],
    { cwd, context }: { cwd: string; context?: YarnContext },
): Promise<void> => {
    registry.stagedFiles.push(...paths)
}

export const gitCommit = async (
    message: string,
    { cwd, context }: { cwd: string; context?: YarnContext },
): Promise<void> => {
    const newSha = Math.random().toString(36).substr(2, 5)
    _commitFiles_(newSha, message, registry.stagedFiles)
    registry.stagedFiles = []
}

const gitLastTaggedCommit = async ({
    cwd,
    context,
    prerelease = false,
}: {
    cwd: string
    context: YarnContext
    prerelease?: boolean
}): Promise<string> => {
    if (!registry.lastTaggedCommit) {
        throw new Error('No tagged commit.')
    }
    return registry.lastTaggedCommit
}

export const getCommitMessages = async (
    config: MonodeployConfiguration,
    context: YarnContext,
): Promise<CommitMessage[]> => {
    const DELIMITER = '-----------------monodeploy-----------------'
    const from = config.git.baseBranch
    const to = config.git.commitSha
    const logOutput = await gitLog(from, to, {
        cwd: config.cwd,
        DELIMITER,
        context,
    })
    return logOutput
        .toString()
        .split(`${DELIMITER}\n`)
        .map((logEntry) => {
            const [sha, ...msg] = logEntry.split('\n')
            return { sha, body: msg.join('\n') }
        })
        .filter((msg) => msg.body)
}

module.exports = {
    __esModule: true,
    _commitFiles_,
    _getPushedTags_,
    _getTags_,
    _reset_,
    _getRegistry_,
    ...actualMonodeployGit,
    getCommitMessages,
    gitAdd,
    gitCommit,
    gitDiffTree,
    gitLastTaggedCommit,
    gitLog,
    gitPull,
    gitPush,
    gitPushTags,
    gitResolveSha,
    gitTag,
}
