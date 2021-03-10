import { execSync } from 'child_process'

import {
    cleanUp,
    createFile,
    getMonodeployConfig,
    initGitRepository,
    setupMonorepo,
} from '@monodeploy/test-utils'

import {
    getCommitMessages,
    gitDiffTree,
    gitPush,
    gitResolveSha,
    gitTag,
} from '.'

describe('@monodeploy/git', () => {
    let context

    beforeEach(async () => {
        context = await setupMonorepo({
            'pkg-1': {},
            'pkg-2': {},
            'pkg-3': { dependencies: ['pkg-2'] },
            'pkg-4': {},
            'pkg-5': { private: true, dependencies: ['pkg-4'] },
            'pkg-6': {
                dependencies: ['pkg-3', 'pkg-7'],
            },
            'pkg-7': {},
        })
        const rootPath = context.project.cwd
        await initGitRepository(rootPath)
    })

    afterEach(async () => {
        jest.restoreAllMocks()
        await cleanUp([context.project.cwd])
    })

    it('gitDiffTree returns list of modified files', async () => {
        const cwd = context.project.cwd

        await createFile({ filePath: 'test.txt', cwd })
        await createFile({ filePath: 'testDir/test.txt', cwd })

        execSync('git add . && git commit -m "test: test file" -n', {
            cwd,
        })
        const headSha = execSync('git rev-parse HEAD', {
            cwd,
            encoding: 'utf8',
        })

        const diffTreeOutput = await gitDiffTree(headSha, { cwd, context })

        expect(diffTreeOutput.trim()).toEqual(
            expect.stringContaining(
                ['test.txt', 'testDir/test.txt'].join('\n'),
            ),
        )
    })

    it('gitResolveSha resolves HEAD properly', async () => {
        const cwd = context.project.cwd

        await createFile({ filePath: 'test.txt', cwd })
        execSync('git add . && git commit -m "test: test file" -n', {
            cwd,
        })
        const headSha = execSync('git rev-parse HEAD', {
            cwd,
            encoding: 'utf8',
        })

        const resolvedHead = await gitResolveSha('HEAD', { cwd, context })

        expect(resolvedHead).toEqual(headSha.trim())
    })

    it('getCommitMessages gets commit messages', async () => {
        const cwd = context.project.cwd

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

        const messages = await getCommitMessages(
            await getMonodeployConfig({
                cwd,
                baseBranch: 'master',
                commitSha: headSha,
            }),
            context,
        )

        expect(messages).toEqual([
            { sha: headSha, body: `${commitMessage}\n\n` },
        ])
    })

    it('gitTag fails if invariant not respected', async () => {
        const cwd = context.project.cwd
        execSync('git commit -m "test: base" --allow-empty', {
            cwd,
        })
        await expect(async () =>
            gitTag('1.0.0', { cwd, context }),
        ).rejects.toMatchInlineSnapshot(
            `[Error: Invariant Violation: Invalid environment test !== production.]`,
        )
    })

    it('gitPush fails if invariant not respected', async () => {
        const cwd = context.project.cwd
        execSync('git commit -m "test: base" --allow-empty', {
            cwd,
        })
        await expect(async () =>
            gitPush('1.0.0', { cwd, context, remote: 'origin' }),
        ).rejects.toMatchInlineSnapshot(
            `[Error: Invariant Violation: Invalid environment test !== production.]`,
        )
    })
})
