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

import run from './runner'

const registryUrl = 'http://localhost:4873'

type RunFn = () => Promise<{
    stdout: string
    stderr: string
    error?: ExecException
}>

type TestCase = (params: { cwd: string; run: RunFn }) => Promise<void>

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
            await exec(
                `git add . && git commit -n -m "initial commit" && git tag initial -m initial && git push -u origin master`,
                {
                    cwd: project,
                },
            )

            await testCase({
                cwd: project,
                run: () => {
                    if (!project) throw new Error('Missing project path.')
                    return run({
                        cwd: project,
                        args: `--config-file ${configFilename}`,
                    })
                },
            })
        } finally {
            await cleanUp(
                [project, remotePath].filter((v): v is string => v !== null),
            )
        }
    }
}
