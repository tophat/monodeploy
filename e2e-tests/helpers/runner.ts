import path from 'path'

import { isNodeError } from '@monodeploy/types'
import { execUtils } from '@yarnpkg/core'
import { npath } from '@yarnpkg/fslib'

const scriptPath = require.resolve('monodeploy')

export default async function run({
    cwd,
    args = [],
}: {
    cwd: string
    args: readonly string[]
}): Promise<{
    stdout: string | undefined
    stderr: string | undefined
    error?: Error
}> {
    const nycBin = require.resolve('nyc/bin/nyc', {
        paths: [process.cwd()],
    })
    const nycConfig = require.resolve('nyc.config.js', {
        paths: [process.cwd()],
    })

    const tsconfig = path.join(process.cwd(), 'tsconfig.json')

    try {
        const { stdout, stderr } = await execUtils.execvp(
            'node',
            [
                nycBin,
                `--nycrc-path ${nycConfig}`,
                `--cwd ${process.cwd()}`,
                'node',
                scriptPath,
                ...args,
            ],
            {
                cwd: npath.toPortablePath(cwd),
                env: {
                    ...process.env,
                    TS_NODE_PROJECT: tsconfig,
                    NODE_ENV: 'production',
                },
            },
        )
        return { stdout, stderr }
    } catch (err) {
        if (isNodeError<Error & { stdout?: string; stderr?: string }>(err)) {
            return { error: err, stdout: err?.stdout, stderr: err?.stderr }
        }
        throw new Error('Unexpected error')
    }
}
