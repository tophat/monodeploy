/* eslint-disable jest/no-export */
import childProcess, { ExecException } from 'child_process'
import { promises as fs } from 'fs'
import os from 'os'
import path from 'path'
import util from 'util'

const exec = util.promisify(childProcess.exec)

import {
    addGitRemote,
    cleanUp,
    initGitRepository,
    setupTestRepository,
    writeConfig,
} from '@monodeploy/test-utils'
import { MonodeployConfiguration, RecursivePartial } from '@monodeploy/types'

import { startRegistry, stopRegistry, waitForRegistry } from './docker'
import run from './runner'

const registryUrl = 'http://localhost:4873'

type RunFn = (args?: Array<string>) => Promise<{
    stdout: string | undefined
    stderr: string | undefined
    error?: Error | (ExecException & { stdout?: string; stderr?: string })
}>

type ExecFn = (cmd: string) => ReturnType<typeof exec>

type ReadFile = (filepath: string) => Promise<string>

type TestCase = (params: {
    cwd: string
    run: RunFn
    readFile: ReadFile
    exec: ExecFn
}) => Promise<void>

export default function setupProject({
    repository,
    config,
    testCase,
}: {
    repository: Parameters<typeof setupTestRepository>
    config: RecursivePartial<MonodeployConfiguration>
    testCase: TestCase
}): () => Promise<void> {
    return async (): Promise<void> => {
        try {
            await stopRegistry()
        } catch {}
        await startRegistry()
        await waitForRegistry(25000)

        let project: string | null = null
        let remotePath: string | null = null

        try {
            // the project we're publishing
            project = await setupTestRepository(...repository)

            // remote to push tags/artifacts to
            remotePath = await fs.mkdtemp(path.join(os.tmpdir(), 'monorepo-'))
            await initGitRepository(remotePath)
            await addGitRemote(project, remotePath, 'origin')

            const configFilename = await writeConfig({
                cwd: project,
                config: {
                    registryUrl,
                    ...config,
                },
            })

            // initial commit
            await exec('git pull --rebase --no-verify origin main', {
                cwd: project,
            })
            await exec('git add . && git commit -n -m "initial commit"', {
                cwd: project,
            })
            await exec('git push -u origin main', {
                cwd: project,
            })

            await testCase({
                cwd: project,
                run: (args?: Array<string>) => {
                    if (!project) throw new Error('Missing project path.')
                    console.log(`Temporary Project: ${project}`)

                    return run({
                        cwd: project,
                        args: [`--config-file ${configFilename}`, ...(args ? args : [])].join(' '),
                    })
                },
                readFile: (filename: string) => {
                    if (!project) throw new Error('Missing project path.')
                    return fs.readFile(path.resolve(project, filename), {
                        encoding: 'utf8',
                    })
                },
                exec: (command: string) => {
                    if (!project) throw new Error('Missing project path.')
                    return exec(command, { cwd: project })
                },
            })
        } finally {
            await cleanUp([project, remotePath].filter((v): v is string => v !== null))
            await stopRegistry()
        }
    }
}
