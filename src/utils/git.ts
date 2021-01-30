import childProcess from 'child_process'

import logging from '../logging'

import { assertProduction } from './invariants'

export const gitResolveSha = async (
    ref: string,
    { cwd }: { cwd: string },
): Promise<string> => {
    const gitCommand = `git log --format="%H" -n 1 ${ref}`
    logging.debug(`[Exec] ${gitCommand}`)
    return childProcess
        .execSync(gitCommand, { encoding: 'utf8', cwd })
        .toString()
        .trim()
}

export const gitDiff = async (
    from: string,
    to: string,
    { cwd }: { cwd: string },
): Promise<string> => {
    const gitCommand = `git diff ${from}...${to} --name-only`
    logging.debug(`[Exec] ${gitCommand}`)
    return childProcess.execSync(gitCommand, {
        encoding: 'utf8',
        cwd,
    })
}

export const gitLog = async (
    from: string,
    to: string,
    { cwd, DELIMITER }: { cwd: string; DELIMITER: string },
): Promise<string> => {
    const gitCommand = `git log ${from}...${to} --format=%H%n%B%n${DELIMITER}`
    logging.debug(`[Exec] ${gitCommand}`)
    return childProcess.execSync(gitCommand, {
        encoding: 'utf8',
        cwd,
    })
}

export const gitTag = async (
    tag: string,
    { cwd }: { cwd: string },
): Promise<void> => {
    assertProduction()
    const gitCommand = `git tag ${tag}`
    logging.debug(`[Exec] ${gitCommand}`)
    childProcess.execSync(gitCommand, { encoding: 'utf8', cwd })
}

export const gitPush = async (
    tag: string,
    { cwd, remote }: { cwd: string; remote: string },
): Promise<void> => {
    assertProduction()
    const gitCommand = `git push ${remote} ${tag}`
    logging.debug(`[Exec] ${gitCommand}`)
    childProcess.execSync(gitCommand, {
        encoding: 'utf8',
        cwd,
    })
}
