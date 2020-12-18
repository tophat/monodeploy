import { execSync } from 'child_process'

import type { MonodeployConfiguration } from '../types'
import logging from '../logging'

const getCommitMessages = async (
    config: MonodeployConfiguration,
): Promise<string[]> => {
    const from = config.git.baseBranch
    const to = config.git.commitSha

    const gitCommand = `git log ${from}...${to} --format=oneline`
    logging.debug(`Exec: ${gitCommand}`)
    const stdout = execSync(gitCommand, {
        encoding: 'utf8',
    })
    const commitMessagePattern = /^[a-z0-9]*\s+(.*)$/gm

    const commitMessages = [...stdout.matchAll(commitMessagePattern)].map(
        match => `${match}\n\n`,
    )
    return commitMessages
}

export default getCommitMessages
