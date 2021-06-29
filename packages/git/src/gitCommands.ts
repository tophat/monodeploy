import childProcess from 'child_process'
import util from 'util'

import logging, { assertProduction } from '@monodeploy/logging'
import { YarnContext } from '@monodeploy/types'

const exec = util.promisify(childProcess.exec)

export const gitResolveSha = async (
    ref: string,
    { cwd, context }: { cwd: string; context?: YarnContext },
): Promise<string> => {
    const gitCommand = `git log --format="%H" -n 1 ${ref}`
    logging.debug(`[Exec] ${gitCommand}`, { report: context?.report })
    return (await exec(gitCommand, { encoding: 'utf8', cwd })).stdout
        .toString()
        .trim()
}

export const gitDiffTree = async (
    ref: string,
    { cwd, context }: { cwd: string; context?: YarnContext },
): Promise<string> => {
    const gitCommand = `git diff-tree --no-commit-id --name-only -r --root ${ref}`
    logging.debug(`[Exec] ${gitCommand}`, { report: context?.report })
    return (
        await exec(gitCommand, {
            encoding: 'utf8',
            cwd,
        })
    ).stdout
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
    let gitCommand = `git log ${from}..${to} --format=%H%n%B%n${DELIMITER}`
    if (from === to) {
        /* Special case where we'll just return a single log entry for "to". */
        gitCommand = `git log -1 ${to} --format=%H%n%B%n${DELIMITER}`
    }

    logging.debug(`[Exec] ${gitCommand}`, { report: context?.report })
    return (
        await exec(gitCommand, {
            encoding: 'utf8',
            cwd,
        })
    ).stdout
}

export const gitTag = async (
    tag: string,
    { cwd, context }: { cwd: string; context?: YarnContext },
): Promise<void> => {
    assertProduction()
    const gitCommand = `git tag ${tag} -m ${tag}`
    logging.debug(`[Exec] ${gitCommand}`, { report: context?.report })
    await exec(gitCommand, { encoding: 'utf8', cwd })
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
    await exec(gitCommand, {
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
    await exec(gitCommand, {
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
    const gitCommand = `git push --no-verify ${remote}`
    logging.debug(`[Exec] ${gitCommand}`, { report: context?.report })
    await exec(gitCommand, {
        encoding: 'utf8',
        cwd,
    })
}

export const gitLastTaggedCommit = async ({
    cwd,
    context,
    prerelease = false,
}: {
    cwd: string
    context?: YarnContext
    prerelease?: boolean
}): Promise<string> => {
    let mostRecentTagCommand = `git describe --abbrev=0 --match '*@*[[:digit:]]*.[[:digit:]]*.[[:digit:]]*'`

    if (!prerelease) {
        // The glob matches prerelease ranges. The 'complexity' comes from not wanting
        // to be overeager in producing a false positive for a tag such as
        // `@scope-with-hyphen/name.with.dot-and-hyphen`
        mostRecentTagCommand = `${mostRecentTagCommand} --exclude '*@*[[:digit:]]*.[[:digit:]]*.[[:digit:]]*-*'`
    }

    logging.debug(`[Exec] ${mostRecentTagCommand}`, { report: context?.report })

    let tag = 'HEAD'

    try {
        tag = (
            await exec(mostRecentTagCommand, {
                encoding: 'utf8',
                cwd,
            })
        ).stdout
            .toString()
            .trim()
    } catch (err) {
        logging.warning(
            `[Exec] Fetching most recent tag failed, falling back to HEAD`,
            { report: context?.report },
        )
    }

    const associatedShaCommand = `git rev-list -1 ${tag}`
    logging.debug(`[Exec] ${associatedShaCommand}`, { report: context?.report })
    return (
        await exec(associatedShaCommand, {
            encoding: 'utf8',
            cwd,
        })
    ).stdout
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
    await exec(gitCommand, { encoding: 'utf8', cwd })
}

export const gitCommit = async (
    message: string,
    { cwd, context }: { cwd: string; context?: YarnContext },
): Promise<void> => {
    assertProduction()
    const gitCommand = `git commit -m "${message}" -n`
    logging.debug(`[Exec] ${gitCommand}`, { report: context?.report })
    await exec(gitCommand, { encoding: 'utf8', cwd })
}
