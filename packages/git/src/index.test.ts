import childProcess from 'child_process'
import util from 'util'

const exec = util.promisify(childProcess.exec)

import {
    cleanUp,
    createFile,
    getMonodeployConfig,
    initGitRepository,
    setupMonorepo,
} from '@monodeploy/test-utils'
import { YarnContext } from '@monodeploy/types'

import {
    getCommitMessages,
    gitAdd,
    gitCommit,
    gitDiffTree,
    gitLastTaggedCommit,
    gitLog,
    gitPushTags,
    gitResolveSha,
    gitTag,
} from '.'

describe('@monodeploy/git', () => {
    let context: YarnContext
    let prevNodeEnv: string | undefined

    beforeEach(async () => {
        prevNodeEnv = process.env.NODE_ENV
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
        await initGitRepository(rootPath, { allowScaffoldingCommits: false })
    })

    afterEach(async () => {
        process.env.NODE_ENV = prevNodeEnv
        jest.restoreAllMocks()
        await cleanUp([context.project.cwd])
    })

    describe('gitDiffTree', () => {
        it('returns list of modified files', async () => {
            const cwd = context.project.cwd

            await createFile({ filePath: 'test.txt', cwd })
            await createFile({ filePath: 'testDir/test.txt', cwd })

            await exec('git add . && git commit -m "test: test file" -n', {
                cwd,
            })
            const { stdout: headSha } = await exec('git rev-parse HEAD', {
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
    })

    describe('gitResolveSha', () => {
        it('resolves HEAD properly', async () => {
            const cwd = context.project.cwd

            await createFile({ filePath: 'test.txt', cwd })
            await exec('git add . && git commit -m "test: test file" -n', {
                cwd,
            })
            const { stdout: headSha } = await exec('git rev-parse HEAD', {
                cwd,
                encoding: 'utf8',
            })

            const resolvedHead = await gitResolveSha('HEAD', { cwd, context })

            expect(resolvedHead).toEqual(headSha.trim())
        })
    })

    describe('gitCommitMessages', () => {
        it('gets commit messages', async () => {
            const cwd = context.project.cwd

            // Create some files and commit them to have a diff.
            await createFile({ filePath: 'test.txt', cwd })
            await exec('git commit -m "test: base" --allow-empty', {
                cwd,
            })
            await exec('git checkout -b test-branch', { cwd })
            const commitMessage = 'test: test file'
            await exec(`git add . && git commit -m "${commitMessage}" -n`, {
                cwd,
            })
            const headSha = (
                await exec('git rev-parse HEAD', {
                    cwd,
                    encoding: 'utf8',
                })
            ).stdout.trim()

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
    })

    describe('gitTag', () => {
        it('fails if invariant not respected', async () => {
            const cwd = context.project.cwd
            await exec('git commit -m "test: base" --allow-empty', {
                cwd,
            })
            await expect(async () =>
                gitTag('1.0.0', { cwd, context }),
            ).rejects.toMatchInlineSnapshot(
                `[Error: Invariant Violation: Invalid environment test !== production.]`,
            )
        })

        it('creates an annotated tag', async () => {
            process.env.NODE_ENV = 'production'

            const { cwd } = context.project

            await exec('git commit -m "test: base" --allow-empty', {
                cwd,
            })

            await gitTag('1.0.0', { cwd, context })

            const { stdout } = await exec('git describe --abbrev=0', { cwd })
            expect(stdout).toEqual(expect.stringContaining('1.0.0'))
        })
    })

    describe('gitPushTags', () => {
        it('fails if invariant not respected', async () => {
            const cwd = context.project.cwd
            await exec('git commit -m "test: base" --allow-empty', {
                cwd,
            })
            await expect(async () =>
                gitPushTags({ cwd, context, remote: 'origin' }),
            ).rejects.toMatchInlineSnapshot(
                `[Error: Invariant Violation: Invalid environment test !== production.]`,
            )
        })
    })

    describe('gitLastTaggedCommit', () => {
        it('defaults to HEAD if no tag exists', async () => {
            const cwd = context.project.cwd
            await createFile({ filePath: 'test.txt', cwd })
            await exec(
                'git add . && git commit -m "chore: initial commit" -n',
                {
                    cwd,
                },
            )

            await createFile({ filePath: 'test1.txt', cwd })
            await exec('git add . && git commit -m "chore: second commit" -n', {
                cwd,
            })

            const headSha = await gitResolveSha('HEAD', { cwd, context })
            const commit = await gitLastTaggedCommit({ cwd, context })
            expect(commit).toEqual(headSha)
        })

        it('defaults to HEAD if on initial commit', async () => {
            const cwd = context.project.cwd
            await createFile({ filePath: 'test.txt', cwd })
            await exec(
                'git add . && git commit -m "chore: initial commit" -n',
                {
                    cwd,
                },
            )
            const headSha = await gitResolveSha('HEAD', { cwd, context })
            const commit = await gitLastTaggedCommit({ cwd, context })
            expect(commit).toEqual(headSha)
        })

        it('gets the last tagged commit', async () => {
            process.env.NODE_ENV = 'production'

            const cwd = context.project.cwd
            await createFile({ filePath: 'test.txt', cwd })
            await exec(
                'git add . && git commit -m "chore: initial commit" -n',
                {
                    cwd,
                },
            )
            const taggedSha = await gitResolveSha('HEAD', { cwd, context })
            await gitTag('test-tag', { cwd, context })

            await createFile({ filePath: 'test2.txt', cwd })
            await exec('git add . && git commit -m "chore: non-tagged" -n', {
                cwd,
            })

            expect(await gitLastTaggedCommit({ cwd, context })).toEqual(
                taggedSha,
            )
        })

        it('skips prerelease tags if not in prerelease mode', async () => {
            process.env.NODE_ENV = 'production'
            const cwd = context.project.cwd

            await createFile({ filePath: 'test.txt', cwd })
            await exec(
                'git add . && git commit -m "chore: initial commit" -n',
                {
                    cwd,
                },
            )
            const releaseTagSha = await gitResolveSha('HEAD', { cwd, context })

            const nonPrereleaseTags = [
                'test-tag@0.0.1',
                'test-tag@v0.0.1',
                'test-tag@pkg-name-dash.1', // only support semantic versions
                '@scope-with-hyphen/name.with.dot-and-hyphen',
            ]
            for (const tag of nonPrereleaseTags) {
                await gitTag(tag, { cwd, context })
            }

            await createFile({ filePath: 'test1.txt', cwd })
            await exec('git add . && git commit -m "chore: second commit" -n', {
                cwd,
            })
            const prereleaseTagSha = await gitResolveSha('HEAD', {
                cwd,
                context,
            })
            await gitTag('test-tag@0.0.2-rc.1', { cwd, context })

            await createFile({ filePath: 'test2.txt', cwd })
            await exec('git add . && git commit -m "chore: non-tagged" -n', {
                cwd,
            })

            const detectedCommit = await gitLastTaggedCommit({
                cwd,
                context,
                prerelease: false,
            })

            expect(detectedCommit).not.toEqual(prereleaseTagSha)
            expect(detectedCommit).toEqual(releaseTagSha)
        })

        it('includes prerelease tags when in prerelease mode', async () => {
            process.env.NODE_ENV = 'production'
            const cwd = context.project.cwd

            await createFile({ filePath: 'test.txt', cwd })
            await exec(
                'git add . && git commit -m "chore: initial commit" -n',
                {
                    cwd,
                },
            )
            const releaseTagSha = await gitResolveSha('HEAD', { cwd, context })
            await gitTag('test-tag@0.0.1', { cwd, context })

            await createFile({ filePath: 'test1.txt', cwd })
            await exec('git add . && git commit -m "chore: second commit" -n', {
                cwd,
            })
            const prereleaseTagSha = await gitResolveSha('HEAD', {
                cwd,
                context,
            })
            await gitTag('test-tag@0.0.2-rc.1', { cwd, context })

            await createFile({ filePath: 'test2.txt', cwd })
            await exec('git add . && git commit -m "chore: non-tagged" -n', {
                cwd,
            })

            const detectedCommit = await gitLastTaggedCommit({
                cwd,
                context,
                prerelease: true,
            })

            expect(detectedCommit).toEqual(prereleaseTagSha)
            expect(detectedCommit).not.toEqual(releaseTagSha)
        })
    })

    describe('gitLog', () => {
        it('returns an entry for commit between from and to refs', async () => {
            process.env.NODE_ENV = 'production'

            const DELIMITER = '===='

            const cwd = context.project.cwd

            await createFile({ filePath: 'other.txt', cwd })
            await exec(
                'git add . && git commit -m "chore: initial commit" -n',
                {
                    cwd,
                },
            )
            const fromSha = await gitResolveSha('HEAD', { cwd, context })

            await createFile({ filePath: 'test.txt', cwd })
            await exec('git add . && git commit -m "chore: second commit" -n', {
                cwd,
            })

            await createFile({ filePath: 'test1.txt', cwd })
            await exec('git add . && git commit -m "chore: third commit" -n', {
                cwd,
            })
            const toSha = await gitResolveSha('HEAD', { cwd, context })

            // Note that gitLog excludes the "from" commit itself
            const logEntries = (
                await gitLog(fromSha, toSha, { cwd, DELIMITER })
            )
                .split(DELIMITER)
                .filter((v) => Boolean(v.trim()))

            expect(logEntries).toHaveLength(2)
            expect(logEntries).toEqual(
                expect.arrayContaining([
                    expect.stringContaining('chore: third commit'),
                    expect.stringContaining('chore: second commit'),
                ]),
            )
        })

        it('returns a single commit entry if "from" ref is the same as "to" ref', async () => {
            process.env.NODE_ENV = 'production'

            const DELIMITER = '===='

            const cwd = context.project.cwd

            await createFile({ filePath: 'other.txt', cwd })
            await exec(
                'git add . && git commit -m "chore: initial commit" -n',
                {
                    cwd,
                },
            )

            await createFile({ filePath: 'test.txt', cwd })
            await exec('git add . && git commit -m "chore: second commit" -n', {
                cwd,
            })
            const sha = await gitResolveSha('HEAD', { cwd, context })

            const logEntries = (await gitLog(sha, sha, { cwd, DELIMITER }))
                .split(DELIMITER)
                .filter((v) => Boolean(v.trim()))

            expect(logEntries).toHaveLength(1)
            expect(logEntries[0]).toEqual(
                expect.stringContaining('chore: second commit'),
            )
        })
    })

    describe('gitAdd, gitCommit', () => {
        it('adds files, commits changes', async () => {
            process.env.NODE_ENV = 'production'

            const cwd = context.project.cwd
            await createFile({ filePath: 'test.txt', cwd })
            await gitAdd(['test.txt'], { cwd, context })

            // assert added
            expect(
                (
                    await exec('git ls-files --error-unmatch test.txt', {
                        encoding: 'utf8',
                        cwd,
                    })
                ).stdout.toString(),
            ).toEqual(expect.stringContaining('test.txt'))

            await gitCommit('chore: initial commit', { cwd, context })

            // assert committed
            expect(
                (
                    await exec('git log -1 --format="%B"', {
                        encoding: 'utf8',
                        cwd,
                    })
                ).stdout.toString(),
            ).toEqual(expect.stringContaining('chore: initial commit'))
        })
    })
})
