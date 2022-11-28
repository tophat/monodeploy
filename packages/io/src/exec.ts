import { PassThrough } from 'stream'

import { type PortablePath, npath, ppath } from '@yarnpkg/fslib'
import { execute } from '@yarnpkg/shell'

export class ExecException extends Error {
    public stdout?: string
    public stderr?: string
    public code: number
    public command: string

    constructor({
        command,
        code,
        stdout,
        stderr,
    }: {
        command: string
        stdout?: string
        stderr?: string
        code: number
    }) {
        super(`Executing '${command}' failed with code: ${code}\n\n${stderr}`)
        this.code = code
        this.stdout = stdout
        this.stderr = stderr
        this.command = command
    }
}

export const exec = async (
    command: string,
    {
        cwd = ppath.cwd(),
        env = process.env,
    }: { cwd?: PortablePath | string; env?: Record<string, string | undefined> } = {},
): Promise<{ stdout: string; stderr: string; code: number }> => {
    const stdoutChunks: string[] = []
    const stderrChunks: string[] = []

    const stdout = new PassThrough()
    const stderr = new PassThrough()

    stdout.on('data', (chunk) => stdoutChunks.push(chunk.toString('utf-8')))
    stderr.on('data', (chunk) => stderrChunks.push(chunk.toString('utf-8')))

    const code = await execute(command, undefined, {
        cwd: npath.toPortablePath(cwd),
        stdout,
        stderr,
        env,
    })

    const stdoutString = stdoutChunks.join('')
    const stderrString = stderrChunks.join('')

    if (code === 0) {
        return { code, stdout: stdoutString, stderr: stderrString }
    }
    throw new ExecException({
        command,
        code,
        stdout: stdoutString,
        stderr: stderrString,
    })
}
