import { PassThrough } from 'stream'

import { PortablePath, npath, ppath } from '@yarnpkg/fslib'
import { execute } from '@yarnpkg/shell'

export class ExecException extends Error {
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
        code,
        stdout: stdoutString,
        stderr: stderrString,
    })
}
