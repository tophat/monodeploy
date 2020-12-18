import { execSync } from 'child_process'
import type { MonodeployConfiguration } from '../types'

const getCommitMessages = async (
    config: MonodeployConfiguration,
): Promise<string[]> => {
    const from = config.git.baseBranch
    const to = config.git.commitSha

    const stdout = execSync(`git log ${from}...${to} --format=oneline`, {
        encoding: 'utf8',
    })
    const commitMessagePattern = /^[a-z0-9]*\s+(.*)$/gm

    const commitMessages = [...stdout.matchAll(commitMessagePattern)].map(
        match => `${match}\n\n`,
    )
    return commitMessages
}

export default getCommitMessages
