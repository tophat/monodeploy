import { execSync } from 'child_process'

import { cleanUp, createFile, setupTestRepository } from '../../../testUtils'

import {
    getCommitMessages,
    gitDiffTree,
    gitPush,
    gitResolveSha,
    gitTag,
} from '.'

describe('monodeploy-git', () => {
    let tempRepositoryRoot

    beforeEach(async () => {
        tempRepositoryRoot = await setupTestRepository()
    })

    afterEach(async () => {
        jest.restoreAllMocks()
        await cleanUp([tempRepositoryRoot])
    })

    it('gitDiffTree returns list of modified files', async () => {
        const cwd = tempRepositoryRoot

        await createFile({ filePath: 'test.txt', cwd })
        await createFile({ filePath: 'testDir/test.txt', cwd })

        execSync('git add . && git commit -m "test: test file" -n', {
            cwd,
        })
        const headSha = execSync('git rev-parse HEAD', {
            cwd,
            encoding: 'utf8',
        })

        const diffTreeOutput = await gitDiffTree(headSha, { cwd })

        expect(diffTreeOutput.trim()).toEqual(
            expect.stringContaining(
                ['test.txt', 'testDir/test.txt'].join('\n'),
            ),
        )
    })

    it('gitResolveSha resolves HEAD properly', async () => {
        const cwd = tempRepositoryRoot

        await createFile({ filePath: 'test.txt', cwd })
        execSync('git add . && git commit -m "test: test file" -n', {
            cwd,
        })
        const headSha = execSync('git rev-parse HEAD', {
            cwd,
            encoding: 'utf8',
        })

        const resolvedHead = await gitResolveSha('HEAD', { cwd })

        expect(resolvedHead).toEqual(headSha.trim())
    })

    it('getCommitMessages gets commit messages', async () => {
        const cwd = tempRepositoryRoot

        // Create some files and commit them to have a diff.
        await createFile({ filePath: 'test.txt', cwd })
        execSync('git commit -m "test: base" --allow-empty', {
            cwd,
        })
        execSync('git checkout -b test-branch', { cwd, stdio: 'ignore' })
        const commitMessage = 'test: test file'
        execSync(`git add . && git commit -m "${commitMessage}" -n`, {
            cwd,
        })
        const headSha = execSync('git rev-parse HEAD', {
            cwd,
            encoding: 'utf8',
        }).trim()

        const messages = await getCommitMessages({
            cwd,
            git: { baseBranch: 'master', commitSha: headSha },
        })

        expect(messages).toEqual([
            { sha: headSha, body: `${commitMessage}\n\n` },
        ])
    })

    it('gitTag fails if invariant not respected', async () => {
        const cwd = tempRepositoryRoot
        execSync('git commit -m "test: base" --allow-empty', {
            cwd,
        })
        await expect(async () =>
            gitTag('1.0.0', { cwd }),
        ).rejects.toMatchInlineSnapshot(
            `[Error: Invariant Violation: Invalid environment test !== production.]`,
        )
    })

    it('gitPush fails if invariant not respected', async () => {
        const cwd = tempRepositoryRoot
        execSync('git commit -m "test: base" --allow-empty', {
            cwd,
        })
        await expect(async () =>
            gitPush('1.0.0', { cwd }),
        ).rejects.toMatchInlineSnapshot(
            `[Error: Invariant Violation: Invalid environment test !== production.]`,
        )
    })
})
