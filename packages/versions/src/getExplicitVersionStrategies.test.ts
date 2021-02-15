import { execSync } from 'child_process'
import { join, resolve } from 'path'

import {
    cleanUp,
    createCommit,
    createFile,
    setupContext,
    setupTestRepository,
} from './test_utils'

// Skipping the git mock as we use a temp repository for these tests.
jest.mock('monodeploy-git', () => jest.requireActual('monodeploy-git'))

import { getExplicitVersionStrategies } from '.'

describe('getExplicitVersionStrategies', () => {
    let repo

    beforeEach(async () => {
        repo = await setupTestRepository()
    })
    afterEach(async () => {
        await cleanUp([repo])
    })

    it('produces strategies if a package has commited changes', async () => {
        const context = await setupContext(repo)
        await createCommit('feat: initial commit', repo)
        execSync('git checkout -b test-branch', { cwd: repo, stdio: 'ignore' })
        await createFile(`packages/pkg-1/test.js`, repo)
        const mockMessage = 'feat: woa'
        await createCommit(mockMessage, repo)
        const headSha = execSync('git rev-parse HEAD', {
            cwd: repo,
            encoding: 'utf8',
        }).trim()
        const strategies = await getExplicitVersionStrategies(
            { cwd: repo, git: { commitSha: headSha, baseBranch: 'master' } },
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
