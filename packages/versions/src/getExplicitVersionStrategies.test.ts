import { execSync } from 'child_process'

import {
    cleanUp,
    createCommit,
    createFile,
    getMonodeployConfig,
    setupContext,
    setupTestRepository,
} from '@monodeploy/test-utils'

// Skipping the git mock as we use a temp repository for these tests.
jest.mock('monodeploy-git', () => jest.requireActual('monodeploy-git'))

import { getExplicitVersionStrategies } from '.'

describe('getExplicitVersionStrategies', () => {
    let tempRepositoryRoot

    beforeEach(async () => {
        tempRepositoryRoot = await setupTestRepository()
    })
    afterEach(async () => {
        await cleanUp([tempRepositoryRoot])
    })

    it('produces strategies if a package has commited changes', async () => {
        const cwd = tempRepositoryRoot
        const context = await setupContext(cwd)
        await createCommit('feat: initial commit', cwd)
        execSync('git checkout -b test-branch', { cwd, stdio: 'ignore' })
        await createFile({ filePath: `packages/pkg-1/test.js`, cwd })
        const mockMessage = 'feat: woa'
        await createCommit(mockMessage, cwd)
        const headSha = execSync('git rev-parse HEAD', {
            cwd,
            encoding: 'utf8',
        }).trim()
        const strategies = await getExplicitVersionStrategies(
            await getMonodeployConfig({
                cwd,
                commitSha: headSha,
                baseBranch: 'master',
            }),
            context,
        )

        expect(strategies).toEqual(
            new Map([
                [
                    'pkg-1',
                    {
                        commits: [{ body: `${mockMessage}\n\n`, sha: headSha }],
                        type: 'minor',
                    },
                ],
            ]),
        )
    })
})
