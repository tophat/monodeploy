import { Transform } from 'stream'

import { PortablePath, ppath } from '@yarnpkg/fslib'
import { execute } from '@yarnpkg/shell'

class CopyToMemory extends Transform {
    private _buffer: string[] = []

    _transform(
        chunk: string | Buffer,
        encoding: BufferEncoding | undefined,
        done: (error: Error | null, data: string | Buffer) => void,
    ) {
        this._buffer.push(chunk.toString('utf-8'))
        done(null, chunk)
    }

    getBufferString(): string {
        return this._buffer.join('')
    }
}

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

export const exec = async (
    command: string,
    { cwd = ppath.cwd() }: { cwd?: PortablePath } = {},
): Promise<{ stdout: string; stderr: string; code: number }> => {
    const stdout = new CopyToMemory()
    const stderr = new CopyToMemory()

    // TODO: how can we point to /dev/null instead while still copying the data?
    const code = await execute(command, undefined, {
        cwd,
        stdout: process.stdout.pipe(stdout),
        stderr: process.stderr.pipe(stderr),
    })
    if (code === 0) {
        return { code, stdout: stdout.getBufferString(), stderr: stderr.getBufferString() }
    }
    throw new ExecException({
        code,
        stdout: stdout.getBufferString(),
        stderr: stderr.getBufferString(),
    })
}
