import { execSync } from 'child_process'

import logging from '../logging'
import type { MonodeployConfiguration } from '../types'

const DELIMITER = '-----------------monodeploy-----------------'

const getCommitMessages = async (
    config: MonodeployConfiguration,
): Promise<string[]> => {
    const from = config.git.baseBranch
    const to = config.git.commitSha

    const gitCommand = `git log ${from}...${to} --format=%B%n${DELIMITER}`
    logging.debug(`Exec: ${gitCommand}`)
    const stdout = execSync(gitCommand, {
        encoding: 'utf8',
        cwd: config.cwd,
    })
    return [...stdout.toString().split(`${DELIMITER}\n`)].filter(msg => msg)
}

export default getCommitMessages
