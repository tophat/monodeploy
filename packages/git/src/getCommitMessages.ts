import type { CommitMessage, MonodeployConfiguration, YarnContext } from '@monodeploy/types'

import { gitLog } from './gitCommands'

const DELIMITER = '-----------------monodeploy-----------------'

export const getCommitMessages = async (
    config: MonodeployConfiguration,
    context?: YarnContext,
): Promise<CommitMessage[]> => {
    const from = config.git.baseBranch
    const to = config.git.commitSha
    const logOutput = await gitLog(from, to, {
        cwd: config.cwd,
        DELIMITER,
        context,
    })
    return logOutput
        .toString()
        .split(`${DELIMITER}\n`)
        .map((logEntry) => {
            const [sha, ...msg] = logEntry.split('\n')
            return { sha, body: msg.join('\n') }
        })
        .filter((msg) => msg.body)
}
