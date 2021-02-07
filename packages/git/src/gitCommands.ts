import childProcess from 'child_process'

import logging, { assertProduction } from 'monodeploy-logging'

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

export const gitDiffTree = async (
    ref: string,
    { cwd }: { cwd: string },
): Promise<string> => {
    const gitCommand = `git diff-tree --no-commit-id --name-only -r --root ${ref}`
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

export const gitLastTaggedCommit = async ({
    cwd,
}: {
    cwd: string
}): Promise<string> => {
    const mostRecentTagCommand = `git describe --abbrev=0`
    logging.debug(`[Exec] ${mostRecentTagCommand}`)

    const tag = childProcess
        .execSync(mostRecentTagCommand, {
            encoding: 'utf8',
            cwd,
        })
        .toString()
        .trim()

    const associatedShaCommand = `git rev-list -1 ${tag}`
    logging.debug(`[Exec] ${associatedShaCommand}`)
    return childProcess
        .execSync(associatedShaCommand, {
            encoding: 'utf8',
            cwd,
        })
        .toString()
        .trim()
}
