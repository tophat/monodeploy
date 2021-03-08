import { Readable } from 'stream'

import { Workspace, structUtils } from '@yarnpkg/core'
import conventionalChangelogWriter from 'conventional-changelog-writer'
import conventionalCommitsParser, { Commit } from 'conventional-commits-parser'

import { readStream, readStreamString } from 'monodeploy-io'
import type {
    CommitMessage,
    MonodeployConfiguration,
    YarnContext,
} from 'monodeploy-types'

type RepositoryInfo = {
    host: string | null
    owner: string | null
    repository: string | null
    repoUrl: string | null
}

const REPOSITORY_PATTERNS: Array<
    [RegExp, (m: RegExpMatchArray) => Partial<RepositoryInfo>]
> = [
    [
        /(?:git\+)?(https?:\/\/[^/]+)\/([^/]+)\/([^/.]+)(?:\.git)?/,
        m => ({ repoUrl: m[0], host: m[1], owner: m[2], repository: m[3] }),
    ],
    [
        /(?:git@)?([^:]+):([^/]+)\/([^/.]+)(?:\.git)?/,
        m => ({
            repoUrl: `https://${m[1]}/${m[2]}/${m[3]}`,
            host: `https://${m[1]}`,
            owner: m[2],
            repository: m[3],
        }),
    ],
]

export const parseRepositoryProperty = async (
    workspace: Workspace,
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

    return data
}

const generateChangelogEntry = async (
    config: MonodeployConfiguration,
    context: YarnContext,
    packageName: string,
    previousVersion: string | null,
    newVersion: string,
    commits: CommitMessage[],
): Promise<string | null> => {
    if (!config.conventionalChangelogConfig) {
        return null
    }

    const ident = structUtils.parseIdent(packageName)
    const workspace = context.project.getWorkspaceByIdent(ident)

    const conventionalConfig = await require(require.resolve(
        config.conventionalChangelogConfig,
        { paths: [config.cwd] },
    ))

    const commitsStream = Readable.from(
        commits.map(commit => commit.body),
    ).pipe(conventionalCommitsParser(conventionalConfig.parserOpts))
    const conventionalCommits = await readStream<Commit>(commitsStream)

    const { host, owner, repository, repoUrl } = await parseRepositoryProperty(
        workspace,
    )

    const templateContext = {
        version: newVersion,
        title: `${packageName}@${newVersion}`,
        host: host ?? '',
        owner: owner ?? workspace.manifest.raw?.author ?? '',
        repository: repository ?? '',
        repoUrl: repoUrl ?? '',
        currentTag: `${packageName}@${newVersion}`,
        previousTag: previousVersion
            ? `${packageName}@${previousVersion}`
            : undefined,
        linkCompare: Boolean(previousVersion),
    }

    const changelogWriter = conventionalChangelogWriter(
        templateContext,
        conventionalConfig.writerOpts,
    )

    async function* transformedCommits() {
        for (const commit of conventionalCommits) {
            // NOTE: This mutates the commit.
            const mutableCommit = JSON.parse(JSON.stringify(commit))

            await conventionalConfig.writerOpts?.transform?.(
                mutableCommit,
                templateContext,
            )

            if (!mutableCommit.hash && config.git.commitSha) {
                mutableCommit.hash = config.git.commitSha
            }

            yield mutableCommit
        }
    }

    const pipeline = Readable.from(transformedCommits()).pipe(changelogWriter)

    return readStreamString(pipeline)
}

export default generateChangelogEntry
