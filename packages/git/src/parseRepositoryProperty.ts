import { type Workspace, structUtils } from '@yarnpkg/core'

export type RepositoryInfo = {
    host: string | null
    owner: string | null
    repository: string | null
    repoUrl: string | null
}

const REPOSITORY_PATTERNS: Array<[RegExp, (m: RegExpMatchArray) => Partial<RepositoryInfo>]> = [
    [
        /((?:git\+)?(https?:\/\/[^/]+)\/([^.]+)\/([^/.]+))(?:\.git)?/,
        (m) => ({ repoUrl: m[1], host: m[2], owner: m[3], repository: m[4] }),
    ],
    [
        /(?:git@)?([^:]+):([^.]+)\/([^/.]+)(?:\.git)?/,
        (m) => ({
            repoUrl: `https://${m[1]}/${m[2]}/${m[3]}`,
            host: `https://${m[1]}`,
            owner: m[2],
            repository: m[3],
        }),
    ],
]

export const parseRepositoryProperty = async (
    workspace: Workspace,
    { fallbackToTopLevel = true }: { fallbackToTopLevel?: boolean } = {},
): Promise<RepositoryInfo> => {
    const rawManifest = workspace.manifest.raw

    const data: RepositoryInfo = {
        host: null,
        owner: null,
        repository: null,
        repoUrl: null,
    }

    const repositoryUrl: string =
        (typeof rawManifest?.repository === 'string'
            ? rawManifest?.repository
            : rawManifest?.repository?.url) ?? ''

    for (const [pattern, cb] of REPOSITORY_PATTERNS) {
        const matches = repositoryUrl.match(pattern)
        if (!matches) continue
        try {
            const result = cb(matches)
            if (result) {
                Object.assign(data, result)
                break
            }
        } catch {}
    }

    if (
        fallbackToTopLevel &&
        !structUtils.areDescriptorsEqual(
            workspace.anchoredDescriptor,
            workspace.project.topLevelWorkspace.anchoredDescriptor,
        ) &&
        !data.repository
    ) {
        return await parseRepositoryProperty(workspace.project.topLevelWorkspace)
    }

    return data
}
