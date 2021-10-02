import { exec } from '@monodeploy/io'
import logging, { assertProduction } from '@monodeploy/logging'
import { YarnContext } from '@monodeploy/types'

const git = async (
    subcommand: string,
    { cwd, context }: { cwd: string; context?: YarnContext },
) => {
    const command = `git ${subcommand}`
    logging.debug(`[Exec] ${command}`, { report: context?.report })

    return await exec(command, { cwd })
}

export const gitResolveSha = async (
    ref: string,
    { cwd, context }: { cwd: string; context?: YarnContext },
): Promise<string> => {
    const { stdout } = await git(`log --format=%H -n 1 ${ref}`, {
        cwd,
        context,
    })
    return stdout.trim()
}

export const gitDiffTree = async (
    ref: string,
    { cwd, context }: { cwd: string; context?: YarnContext },
): Promise<string> => {
    const { stdout } = await git(`diff-tree --no-commit-id --name-only -r --root ${ref.trim()}`, {
        cwd,
        context,
    })
    return stdout.trim()
}

export const gitLog = async (
    from: string,
    to: string,
    { cwd, DELIMITER, context }: { cwd: string; DELIMITER: string; context?: YarnContext },
): Promise<string> => {
    let command = `log ${from}..${to} --format=%H%n%B%n${DELIMITER}`
    if (from === to) {
        /* Special case where we'll just return a single log entry for "to". */
        command = `log -1 ${to} --format=%H%n%B%n${DELIMITER}`
    }
    const { stdout } = await git(command, { cwd, context })
    return stdout
}

export const gitTag = async (
    tag: string,
    { cwd, context }: { cwd: string; context?: YarnContext },
): Promise<void> => {
    assertProduction()
    await git(`tag ${tag} -m ${tag}`, { cwd, context })
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
    await git(`push --tags ${remote}`, {
        cwd,
        context,
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
    await git(`pull --rebase --no-verify ${remote}`, {
        cwd,
        context,
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
    await git(`push --no-verify ${remote}`, {
        cwd,
        context,
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
    let command = "describe --abbrev=0 --match '*@*[[:digit:]]*.[[:digit:]]*.[[:digit:]]*'"

    if (!prerelease) {
        // The glob matches prerelease ranges. The 'complexity' comes from not wanting
        // to be overeager in producing a false positive for a tag such as
        // `@scope-with-hyphen/name.with.dot-and-hyphen`
        command = `${command} --exclude '*@*[[:digit:]]*.[[:digit:]]*.[[:digit:]]*-*'`
    }

    let tag = 'HEAD'

    try {
        tag = (await git(command, { cwd, context })).stdout.trim()
    } catch (err) {
        logging.warning('[Exec] Fetching most recent tag failed, falling back to HEAD', {
            report: context?.report,
        })
    }

    return (
        await git(`rev-list -1 ${tag}`, {
            cwd,
            context,
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
    await git(`add ${paths.join(' ')}`, { cwd, context })
}

export const gitCommit = async (
    message: string,
    { cwd, context }: { cwd: string; context?: YarnContext },
): Promise<void> => {
    assertProduction()
    await git(`commit -m "${message}" -n`, { cwd, context })
}
