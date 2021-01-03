import { Readable } from 'stream'

import conventionalChangelogWriter from 'conventional-changelog-writer'
import { Commit } from 'conventional-commits-parser' // it requires hash, so this is the wrong type..

import type { MonodeployConfiguration, YarnContext } from '../types'

import { readStreamString } from './stream'

const generateChangelogEntry = async (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    config: MonodeployConfiguration,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    context: YarnContext,
): Promise<string | null> => {
    // TODO: a version of the commit in versionStrategy but with "hash", and grouped per workspace
    const rawCommits: Commit[] = []

    const templateContext = {
        version: '',
        title: '',
        host: '',
        owner: '',
        repository: '',
        repoUrl: '', // TODO: fallback if repository does not exist (host + repository)
    }

    const writerOpts = {} // TODO: taken from conventional config as writerOpts

    const changelogWriter = conventionalChangelogWriter(
        templateContext,
        writerOpts,
    )

    return readStreamString(Readable.from(rawCommits).pipe(changelogWriter))
}

export default generateChangelogEntry
