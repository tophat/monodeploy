import path from 'path'

import { exec } from '@monodeploy/io'
import {
    cleanUp,
    createCommit,
    createFile,
    getMonodeployConfig,
    setupContext,
    setupTestRepository,
} from '@monodeploy/test-utils'
import { type PortablePath, npath } from '@yarnpkg/fslib'

// Skipping the git mock as we use a temp repository for these tests.
jest.mock('@monodeploy/git', () => jest.requireActual('@monodeploy/git'))

import { getExplicitVersionStrategies } from '.'

describe('getExplicitVersionStrategies', () => {
    let tempRepositoryRoot: PortablePath

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
        await exec('git checkout -b test-branch', { cwd: npath.toPortablePath(cwd) })
        await createFile({ filePath: path.join('packages', 'pkg-1', 'test.js'), cwd })
        const mockMessage = 'feat: woa'
        await createCommit(mockMessage, cwd)
        const headSha = (
            await exec('git rev-parse HEAD', {
                cwd: npath.toPortablePath(cwd),
            })
        ).stdout.trim()
        const strategies = await getExplicitVersionStrategies({
            config: await getMonodeployConfig({
                cwd,
                commitSha: headSha,
                baseBranch: 'main',
            }),
            context,
        })

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

    it('ignores ignored commits based on ignore patterns', async () => {
        const cwd = tempRepositoryRoot
        const context = await setupContext(cwd)
        await createCommit('feat: initial commit', cwd)
        await exec('git checkout -b test-branch', { cwd: npath.toPortablePath(cwd) })

        await createFile({ filePath: path.join('packages', 'pkg-1', 'test.js'), cwd })
        await createCommit('feat: ignore-me!', cwd)

        await createFile({ filePath: path.join('packages', 'pkg-2', 'test.js'), cwd })
        const mockMessage = 'feat: pick me!'
        await createCommit(mockMessage, cwd)

        const headSha = (
            await exec('git rev-parse HEAD', {
                cwd: npath.toPortablePath(cwd),
            })
        ).stdout.trim()

        const strategies = await getExplicitVersionStrategies({
            config: {
                ...(await getMonodeployConfig({
                    cwd,
                    commitSha: headSha,
                    baseBranch: 'main',
                })),
                commitIgnorePatterns: ['ignore-me'],
            },
            context,
        })

        expect(strategies.has('pkg-1')).toBe(false)
        expect(strategies).toEqual(
            new Map([
                [
                    'pkg-2',
                    {
                        commits: [{ body: `${mockMessage}\n\n`, sha: headSha }],
                        type: 'minor',
                    },
                ],
            ]),
        )
    })

    it('ignores ignored files', async () => {
        const cwd = tempRepositoryRoot
        const context = await setupContext(cwd)
        await createCommit('feat: initial commit', cwd)
        await exec('git checkout -b test-branch', { cwd: npath.toPortablePath(cwd) })

        await createFile({ filePath: path.join('packages', 'pkg-1', 'test.js'), cwd })
        await createFile({ filePath: path.join('packages', 'pkg-2', 'test.test.js'), cwd })

        const mockMessage = 'feat: woa'
        await createCommit(mockMessage, cwd)
        const headSha = (
            await exec('git rev-parse HEAD', {
                cwd: npath.toPortablePath(cwd),
            })
        ).stdout.trim()

        const strategies = await getExplicitVersionStrategies({
            config: {
                ...(await getMonodeployConfig({
                    cwd,
                    commitSha: headSha,
                    baseBranch: 'main',
                })),
                changesetIgnorePatterns: ['**/*.test.js', '**/*.md'],
            },
            context,
        })

        expect(strategies.has('pkg-2')).toBe(false)
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
