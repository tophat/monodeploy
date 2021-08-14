/* eslint-disable no-undef */
import childProcess, { ExecException } from 'child_process'
import path from 'path'
import util from 'util'

const exec = util.promisify(childProcess.exec)

const scriptPath = require.resolve('monodeploy')

export default async function run({ cwd, args = '' }: { cwd: string; args: string }): Promise<{
    stdout: string
    stderr: string
    error?: ExecException
}> {
    const nycBin = require.resolve('nyc/bin/nyc', { paths: [process.cwd()] })
    const nycConfig = require.resolve('nyc.config.js', { paths: [process.cwd()] })

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
    } catch (error) {
        return { error, stdout: error?.stdout, stderr: error?.stderr }
    }
}
