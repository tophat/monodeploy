import gitRawCommits from 'git-raw-commits'
import type { MonodeployConfiguration } from '../types'

const getCommitMessages = async (
    config: MonodeployConfiguration,
): Promise<string[]> => {
    const from = config.git.baseBranch
    const to = config.git.commitSha

    return new Promise((resolve, reject) => {
        const data: string[] = []
        const readStream = gitRawCommits({ from, to }, { cwd: config.cwd })
        readStream.on('data', chunk => data.push(chunk.toString('utf-8')))
        readStream.on('error', reject)
        readStream.on('end', () => resolve(data))
    })
}

export default getCommitMessages
