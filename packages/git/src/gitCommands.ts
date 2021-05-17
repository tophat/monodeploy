import childProcess from 'child_process'

import logging, { assertProduction } from '@monodeploy/logging'
import { YarnContext } from '@monodeploy/types'

export const gitResolveSha = async (
    ref: string,
    { cwd, context }: { cwd: string; context?: YarnContext },
): Promise<string> => {
    const gitCommand = `git log --format="%H" -n 1 ${ref}`
    logging.debug(`[Exec] ${gitCommand}`, { report: context?.report })
    return childProcess
        .execSync(gitCommand, { encoding: 'utf8', cwd })
        .toString()
        .trim()
}

export const gitDiffTree = async (
    ref: string,
    { cwd, context }: { cwd: string; context?: YarnContext },
): Promise<string> => {
    const gitCommand = `git diff-tree --no-commit-id --name-only -r --root ${ref}`
    logging.debug(`[Exec] ${gitCommand}`, { report: context?.report })
    return childProcess.execSync(gitCommand, {
        encoding: 'utf8',
        cwd,
    })
}

export const gitLog = async (
    from: string,
    to: string,
    {
        cwd,
        DELIMITER,
        context,
    }: { cwd: string; DELIMITER: string; context?: YarnContext },
): Promise<string> => {
    const gitCommand = `git log ${from}..${to} --format=%H%n%B%n${DELIMITER}`
    logging.debug(`[Exec] ${gitCommand}`, { report: context?.report })
    return childProcess.execSync(gitCommand, {
        encoding: 'utf8',
        cwd,
    })
}

export const gitTag = async (
    tag: string,
    { cwd, context }: { cwd: string; context?: YarnContext },
): Promise<void> => {
    assertProduction()
    const gitCommand = `git tag ${tag} -m ${tag}`
    logging.debug(`[Exec] ${gitCommand}`, { report: context?.report })
    childProcess.execSync(gitCommand, { encoding: 'utf8', cwd })
}

export const gitPushTags = async ({
    cwd,
    remote,
    context,
}: {
    cwd: string
    remote: string
    context?: YarnContext
}): Promise<void> => {
    assertProduction()
    const gitCommand = `git push --tags ${remote}`
    logging.debug(`[Exec] ${gitCommand}`, { report: context?.report })
    childProcess.execSync(gitCommand, {
        encoding: 'utf8',
        cwd,
    })
}

export const gitPull = async ({
    cwd,
    remote,
    context,
}: {
    cwd: string
    remote: string
    context?: YarnContext
}): Promise<void> => {
    assertProduction()
    const gitCommand = `git pull --rebase --no-verify ${remote}`
    logging.debug(`[Exec] ${gitCommand}`, { report: context?.report })
    childProcess.execSync(gitCommand, {
        encoding: 'utf8',
        cwd,
    })
}

export const gitPush = async ({
    cwd,
    remote,
    context,
}: {
    cwd: string
    remote: string
    context?: YarnContext
}): Promise<void> => {
    assertProduction()
    const gitCommand = `git push -n ${remote}`
    logging.debug(`[Exec] ${gitCommand}`, { report: context?.report })
    childProcess.execSync(gitCommand, {
        encoding: 'utf8',
        cwd,
    })
}

export const gitLastTaggedCommit = async ({
    cwd,
    context,
}: {
    cwd: string
    context?: YarnContext
}): Promise<string> => {
    const mostRecentTagCommand = `git describe --abbrev=0`
    logging.debug(`[Exec] ${mostRecentTagCommand}`, { report: context?.report })

    let tag = 'HEAD^'

    try {
        tag = childProcess
            .execSync(mostRecentTagCommand, {
                encoding: 'utf8',
                cwd,
            })
            .toString()
            .trim()
    } catch (err) {
        logging.warning(
            `[Exec] Fetching most recent tag failed, falling back to HEAD^`,
            { report: context?.report },
        )
    }

    const associatedShaCommand = `git rev-list -1 ${tag}`
    logging.debug(`[Exec] ${associatedShaCommand}`, { report: context?.report })
    return childProcess
        .execSync(associatedShaCommand, {
            encoding: 'utf8',
            cwd,
        })
        .toString()
        .trim()
}

export const gitAdd = async (
    paths: string[],
    { cwd, context }: { cwd: string; context?: YarnContext },
): Promise<void> => {
    assertProduction()
    const gitCommand = `git add ${paths.join(' ')}`
    logging.debug(`[Exec] ${gitCommand}`, { report: context?.report })
    childProcess.execSync(gitCommand, { encoding: 'utf8', cwd })
}

export const gitCommit = async (
    message: string,
    { cwd, context }: { cwd: string; context?: YarnContext },
): Promise<void> => {
    assertProduction()
    const gitCommand = `git commit -m "${message}" -n`
    logging.debug(`[Exec] ${gitCommand}`, { report: context?.report })
    childProcess.execSync(gitCommand, { encoding: 'utf8', cwd })
}
