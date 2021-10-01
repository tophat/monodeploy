import logging, { assertProduction } from '@monodeploy/logging'
import { YarnContext } from '@monodeploy/types'
import { execUtils } from '@yarnpkg/core'
import { npath } from '@yarnpkg/fslib'

class ExecException extends Error {
    public stdout?: string
    public stderr?: string
    public code: number

    constructor({ code, stdout, stderr }: { stdout?: string; stderr?: string; code: number }) {
        super(`Exec failed with code: ${code}`)
        this.code = code
        this.stdout = stdout
        this.stderr = stderr
    }
}

const exec = async (
    command: string,
    args: string[],
    { cwd, context }: { cwd: string; context?: YarnContext },
) => {
    logging.debug(`[Exec] ${command} ${args.join(' ')}`, { report: context?.report })
    const { stdout, stderr, code } = await execUtils.execvp(command, args, {
        encoding: 'utf-8',
        cwd: npath.toPortablePath(cwd),
    })
    if (code === 0) {
        return { stdout, stderr, code }
    }
    throw new ExecException({ stdout, stderr, code })
}

export const gitResolveSha = async (
    ref: string,
    { cwd, context }: { cwd: string; context?: YarnContext },
): Promise<string> => {
    const { stdout } = await exec('git', ['log', '--format=%H', '-n', '1', ref], {
        cwd,
        context,
    })
    return stdout.trim()
}

export const gitDiffTree = async (
    ref: string,
    { cwd, context }: { cwd: string; context?: YarnContext },
): Promise<string> => {
    const { stdout } = await exec(
        'git',
        ['diff-tree', '--no-commit-id', '--name-only', '-r', '--root', ref.trim()],
        { cwd, context },
    )
    return stdout.trim()
}

export const gitLog = async (
    from: string,
    to: string,
    { cwd, DELIMITER, context }: { cwd: string; DELIMITER: string; context?: YarnContext },
): Promise<string> => {
    let args = ['log', `${from}..${to}`, `--format=%H%n%B%n${DELIMITER}`]
    if (from === to) {
        /* Special case where we'll just return a single log entry for "to". */
        args = ['log', '-1', to, `--format=%H%n%B%n${DELIMITER}`]
    }
    const { stdout } = await exec('git', args, { cwd, context })
    return stdout
}

export const gitTag = async (
    tag: string,
    { cwd, context }: { cwd: string; context?: YarnContext },
): Promise<void> => {
    assertProduction()
    await exec('git', ['tag', tag, '-m', tag], { cwd, context })
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
    await exec('git', ['push', '--tags', remote], {
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
    await exec('git', ['pull', '--rebase', '--no-verify', remote], {
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
    await exec('git', ['push', '--no-verify', remote], {
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
    const args = ['describe', '--abbrev=0', '--match', '*@*[[:digit:]]*.[[:digit:]]*.[[:digit:]]*']

    if (!prerelease) {
        // The glob matches prerelease ranges. The 'complexity' comes from not wanting
        // to be overeager in producing a false positive for a tag such as
        // `@scope-with-hyphen/name.with.dot-and-hyphen`
        args.push('--exclude', '*@*[[:digit:]]*.[[:digit:]]*.[[:digit:]]*-*')
    }

    let tag = 'HEAD'

    try {
        tag = (await exec('git', args, { cwd, context })).stdout.trim()
    } catch (err) {
        logging.warning('[Exec] Fetching most recent tag failed, falling back to HEAD', {
            report: context?.report,
        })
    }

    return (
        await exec('git', ['rev-list', '-1', tag], {
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
    await exec('git', ['add', ...paths], { cwd, context })
}

export const gitCommit = async (
    message: string,
    { cwd, context }: { cwd: string; context?: YarnContext },
): Promise<void> => {
    assertProduction()
    await exec('git', ['commit', '-m', `"${message}"`, '-n'], { cwd, context })
}
