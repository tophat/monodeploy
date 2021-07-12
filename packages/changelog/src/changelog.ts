import { Readable } from 'stream'

import { parseRepositoryProperty } from '@monodeploy/git'
import { readStream, readStreamString } from '@monodeploy/io'
import type {
    CommitMessage,
    MonodeployConfiguration,
    YarnContext,
} from '@monodeploy/types'
import { structUtils } from '@yarnpkg/core'
import conventionalChangelogWriter from 'conventional-changelog-writer'
import conventionalCommitsParser, { Commit } from 'conventional-commits-parser'

import resolveConventionalConfig from './resolveConventionalConfig'

const generateChangelogEntry = async ({
    config,
    context,
    packageName,
    previousVersion,
    newVersion,
    commits,
}: {
    config: MonodeployConfiguration
    context: YarnContext
    packageName: string
    previousVersion: string | null
    newVersion: string
    commits: CommitMessage[]
}): Promise<string | null> => {
    if (!config.conventionalChangelogConfig) {
        return null
    }

    if (!commits.length) {
        return null
    }

    const ident = structUtils.parseIdent(packageName)
    const workspace = context.project.getWorkspaceByIdent(ident)

    const conventionalConfig = await resolveConventionalConfig({ config })

    const commitsStream = Readable.from(
        commits.map((commit) => commit.body),
    ).pipe(conventionalCommitsParser(conventionalConfig.parserOpts))
    const conventionalCommits = await readStream<Commit>(commitsStream)

    const { host, owner, repository, repoUrl } = await parseRepositoryProperty(
        workspace,
    )

    const templateContext = {
        version: newVersion,
        title: packageName,
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
