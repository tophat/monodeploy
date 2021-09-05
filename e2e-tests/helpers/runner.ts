/* eslint-disable no-undef */
import childProcess, { ExecException } from 'child_process'
import path from 'path'
import util from 'util'

import { isNodeError } from '@monodeploy/types'

const exec = util.promisify(childProcess.exec)

const scriptPath = require.resolve('monodeploy')

export default async function run({ cwd, args = '' }: { cwd: string; args: string }): Promise<{
    stdout: string | undefined
    stderr: string | undefined
    error?: ExecException | Error
}> {
    const nycBin = require.resolve('nyc/bin/nyc', {
        paths: [process.cwd()],
    })
    const nycConfig = require.resolve('nyc.config.js', {
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
        return { stdout, stderr }
    } catch (err) {
        if (isNodeError<ExecException & { stdout?: string; stderr?: string }>(err)) {
            return { error: err, stdout: err?.stdout, stderr: err?.stderr }
        }
        throw new Error('Unexpected error')
    }
}
