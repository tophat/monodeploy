import type { CommitMessage, MonodeployConfiguration } from '@monodeploy/types'

import { gitLog } from './gitCommands'

const DELIMITER = '-----------------monodeploy-----------------'

export const getCommitMessages = async (
    config: MonodeployConfiguration,
): Promise<CommitMessage[]> => {
    const from = config.git.baseBranch
    const to = config.git.commitSha
    const logOutput = await gitLog(from, to, { cwd: config.cwd, DELIMITER })
    return logOutput
        .toString()
        .split(`${DELIMITER}\n`)
        .map(logEntry => {
            const [sha, ...msg] = logEntry.split('\n')
            return { sha, body: msg.join('\n') }
        })
        .filter(msg => msg.body)
}
