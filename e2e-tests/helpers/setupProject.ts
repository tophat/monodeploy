/* eslint-disable jest/no-export */
import { promises as fs } from 'fs'
import os from 'os'
import path from 'path'

import {
    addGitRemote,
    cleanUp,
    initGitRepository,
    setupTestRepository,
    writeConfig,
} from '@monodeploy/test-utils'
import { MonodeployConfiguration, RecursivePartial } from '@monodeploy/types'
import { execUtils } from '@yarnpkg/core'
import { npath } from '@yarnpkg/fslib'

import { startRegistry, stopRegistry, waitForRegistry } from './docker'
import run from './runner'

const registryUrl = 'http://localhost:4873'

type RunFn = (args?: Array<string>) => Promise<{
    stdout: string | undefined
    stderr: string | undefined
    error?: Error | (Error & { stdout?: string; stderr?: string })
}>

type ExecFn = (cmd: string, args?: readonly string[]) => ReturnType<typeof execUtils['execvp']>

type ReadFile = (filepath: string) => Promise<string>

type WriteFile = (filepath: string, data: string | Record<string, unknown>) => Promise<string>

type TestCase = (params: {
    cwd: string
    run: RunFn
    readFile: ReadFile
    writeFile: WriteFile
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
            await execUtils.execvp('git', ['pull', '--rebase', '--no-verify', 'origin', 'main'], {
                cwd: npath.toPortablePath(project),
                encoding: 'utf-8',
            })
            await execUtils.execvp('git', ['add', '.'], {
                cwd: npath.toPortablePath(project),
                encoding: 'utf-8',
            })
            await execUtils.execvp('git', ['commit', '-n', '-m "initial commit"'], {
                cwd: npath.toPortablePath(project),
                encoding: 'utf-8',
            })
            await execUtils.execvp('git', ['push', '-u', 'origin', 'main'], {
                cwd: npath.toPortablePath(project),
                encoding: 'utf-8',
            })

            await testCase({
                cwd: project,
                run: (args?: Array<string>) => {
                    if (!project) throw new Error('Missing project path.')
                    console.log(`Temporary Project: ${project}`)

                    return run({
                        cwd: project,
                        args: [`--config-file ${configFilename}`, ...(args ? args : [])],
                    })
                },
                readFile: (filename: string) => {
                    if (!project) throw new Error('Missing project path.')
                    return fs.readFile(path.resolve(project, filename), {
                        encoding: 'utf8',
                    })
                },
                writeFile: async (
                    filename: string,
                    data: string | Record<string, unknown>,
                ): Promise<string> => {
                    if (!project) throw new Error('Missing project path.')
                    const fullFilename = path.resolve(project, filename)
                    await fs.appendFile(
                        filename,
                        typeof data === 'string' ? data : JSON.stringify(data, null, 4),
                        'utf-8',
                    )
                    return fullFilename
                },
                exec: (command: string, args: readonly string[] = []) => {
                    if (!project) throw new Error('Missing project path.')
                    return execUtils.execvp(command, [...args], {
                        cwd: npath.toPortablePath(project),
                        encoding: 'utf-8',
                    })
                },
            })
        } finally {
            await cleanUp([project, remotePath].filter((v): v is string => v !== null))
            await stopRegistry()
        }
    }
}
