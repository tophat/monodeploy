/* eslint-disable no-undef */
import path from 'path'

import { type ExecException, exec } from '@monodeploy/io'
import { isNodeError } from '@monodeploy/types'

const scriptPath = require.resolve('monodeploy')

export default async function run({ cwd, args = '' }: { cwd: string; args: string }): Promise<{
    stdout: string | undefined
    stderr: string | undefined
    error?: ExecException | Error
}> {
    const nycBin = require.resolve('nyc/bin/nyc', {
        paths: [process.cwd()],
    })
    const nycConfig = require.resolve('./nyc.config.js', {
        paths: [process.cwd()],
    })

    const tsconfig = path.join(process.cwd(), 'tsconfig.json')

    try {
        const { stdout, stderr } = await exec(
            `node ${nycBin} --nycrc-path ${nycConfig} --cwd ${process.cwd()} node ${scriptPath} ${args}`,
            {
                cwd,
                env: {
                    ...process.env,
                    TS_NODE_PROJECT: tsconfig,
                    NODE_ENV: 'production',
                },
            },
        )
        if (process.env.DEBUG?.includes('test:e2e')) {
            if (stdout) console.log(stdout)
            if (stderr) console.error(stderr)
        }
        return { stdout, stderr }
    } catch (err) {
        if (isNodeError<ExecException>(err)) {
            return { error: err, stdout: err?.stdout, stderr: err?.stderr }
        }
        throw new Error('Unexpected error')
    }
}
