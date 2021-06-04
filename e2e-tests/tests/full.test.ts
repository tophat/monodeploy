import childProcess from 'child_process'
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

import run from '../runner'

const registryUrl = 'http://localhost:4873'

describe('Full E2E', () => {
    let vendor: string
    let project: string
    let remotePath: string

    beforeEach(async () => {
        // some "third party" library
        vendor = await setupTestRepository({
            'my-external-lib': {},
        })

        // the project we're publishing
        project = await setupTestRepository({
            'pkg-1': {},
            'pkg-2': {
                dependencies: [
                    [
                        'my-external-lib',
                        `file:${path.resolve(
                            vendor,
                            path.join('packages', 'my-external-lib'),
                        )}`,
                    ],
                    'pkg-1',
                ],
            },
            'pkg-3': { dependencies: ['pkg-2'] },
            'pkg-4': { dependencies: ['pkg-3'] },
            'pkg-isolated': {},
        })

        // remote to push tags/artifacts to
        remotePath = await fs.mkdtemp(path.join(os.tmpdir(), 'monorepo-'))
        await initGitRepository(remotePath)
        await addGitRemote(project, remotePath, 'origin')
    })

    afterEach(async () => {
        await cleanUp([vendor, project, remotePath])
    })

    it('runs the full monodeploy pipeline', async () => {
        const config: RecursivePartial<MonodeployConfiguration> = {
            registryUrl,
            dryRun: true,
        }
        const configFilename = await writeConfig({ cwd: project, config })

        // initial commit
        await exec(
            `git add . && git commit -n -m "initial commit" && git tag initial -m initial && git push -u origin master`,
            {
                cwd: project,
            },
        )

        // a semantic commit
        await exec(`echo "Modification." >> packages/pkg-1/README.md`, {
            cwd: project,
        })
        await exec(
            `git add . && git commit -n -m "feat: some fancy addition" && git push`,
            { cwd: project },
        )

        const { stdout, stderr } = await run({
            cwd: project,
            args: `--config-file ${configFilename}`,
        })

        // TODO
        console.log(stdout, stderr)

        // TODO: replace with actual assertion...
        expect(true).toBe(true)
    }, 30000)
})
