import { Readable } from 'stream'
import url from 'url'

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

const parseRepositoryProperty = async (
    workspace: Workspace,
): Promise<RepositoryInfo> => {
    const rawManifest = workspace.manifest.raw

    const data: RepositoryInfo = {
        host: null,
        owner: null,
        repository: null,
        repoUrl: null,
    }

    const repositoryUrl = rawManifest?.repository?.url ?? ''
    if (repositoryUrl.startsWith('git+')) {
        data.repoUrl = repositoryUrl.substring('git+'.length)
    }

    if (repositoryUrl.endsWith('.git')) {
        const parts = repositoryUrl.split('/')

        const repository = parts.pop()
        const owner = parts.pop()

        data.repository = repository.substring(
            0,
            repository.length - '.git'.length,
        )
        data.owner = owner
    }

    if (data.repoUrl?.startsWith('https://')) {
        const parsedUrl = url.parse(data.repoUrl)
        if (parsedUrl?.hostname) {
            data.host = `${parsedUrl.protocol}//${parsedUrl.host}`
        }
    }

    return data
}

const generateChangelogEntry = async (
    config: MonodeployConfiguration,
    context: YarnContext,
    packageName: string,
    version: string,
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
        version,
        title: `${packageName}@${version}`,
        host: host ?? '',
        owner: owner ?? workspace.manifest.raw?.author ?? '',
        repository: repository ?? '',
        repoUrl: repoUrl ?? '',
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
