/* eslint-disable @typescript-eslint/no-unused-vars */

const registry = {
    commits: [],
    filesModified: [],
    tags: [],
    pushedTags: [],
}

export const _reset_ = (): void => {
    registry.commits = []
    registry.filesModified = []
    registry.tags = []
    registry.pushedTags = []
}

export const _commitFiles_ = (commit: string, files: string[]): void => {
    registry.commits.push(commit)
    registry.filesModified.push(...files)
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

export const gitDiff = async (
    from: string,
    to: string,
    { cwd }: { cwd: string },
): Promise<string> => {
    return registry.filesModified.join('\n')
}

export const gitLog = async (
    from: string,
    to: string,
    { cwd, DELIMITER }: { cwd: string; DELIMITER: string },
): Promise<string> => {
    return registry.commits.join(`${DELIMITER}\n`)
}

export const gitTag = async (
    tag: string,
    { cwd }: { cwd: string },
): Promise<void> => {
    registry.tags.push(tag)
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
