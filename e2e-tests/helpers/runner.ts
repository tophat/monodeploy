import childProcess, { ExecException } from 'child_process'
import path from 'path'
import util from 'util'

const exec = util.promisify(childProcess.exec)

const scriptPath = require.resolve('monodeploy')

export default async function run({
    cwd,
    args = '',
}: {
    cwd: string
    args: string
}): Promise<{
    stdout: string
    stderr: string
    error?: ExecException
}> {
    // add cov to ts-node?

    const tsNode = require.resolve('ts-node/dist/bin', {
        paths: [process.cwd()],
    })
    const nycBin = require.resolve('nyc/bin/nyc', {
        paths: [process.cwd()],
    })
    const nycConfig = require.resolve('../nyc.config.js')

    const tsconfig = path.join(process.cwd(), 'tsconfig.json')

    try {
        const { stdout, stderr } = await exec(
            `node ${nycBin} --nycrc-path ${nycConfig} --cwd ${process.cwd()} node ${tsNode} --project ${tsconfig} ${scriptPath} ${args}`,
            { cwd },
        )
        return { stdout, stderr }
    } catch (error) {
        return { error, stdout: error?.stdout, stderr: error?.stderr }
    }
}
