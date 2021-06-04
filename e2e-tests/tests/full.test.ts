import { promises as fs } from 'fs'
import os from 'os'
import path from 'path'

import {
    addGitRemote,
    cleanUp,
    initGitRepository,
    setupTestRepository,
} from '@monodeploy/test-utils'

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
})
