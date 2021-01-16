import type { MonodeployConfiguration } from '../types'

import { gitLog } from './git'

const DELIMITER = '-----------------monodeploy-----------------'

const getCommitMessages = async (
    config: MonodeployConfiguration,
): Promise<string[]> => {
    const from = config.git.baseBranch
    const to = config.git.commitSha
    const logOutput = await gitLog(from, to, { cwd: config.cwd, DELIMITER })
    return [...logOutput.toString().split(`${DELIMITER}\n`)].filter(msg => msg)
}

export default getCommitMessages
