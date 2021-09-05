import { promises as fs } from 'fs'
import os from 'os'
import path from 'path'

import * as git from '@monodeploy/git'
import { LOG_LEVELS } from '@monodeploy/logging'
import { setupMonorepo } from '@monodeploy/test-utils'
import type { MonodeployConfiguration, YarnContext } from '@monodeploy/types'
import { npath } from '@yarnpkg/fslib'
import * as npm from '@yarnpkg/plugin-npm'

import monodeploy from '..'

jest.mock('@yarnpkg/plugin-npm')
jest.mock('@monodeploy/git')

const mockGit = git as jest.Mocked<
    typeof git & {
        _reset_: () => void
        _commitFiles_: (sha: string, commit: string, files: string[]) => void
        _getPushedTags_: () => string[]
        _getTags_: () => string[]
    }
>
const mockNPM = npm as jest.Mocked<
    typeof npm & {
        _reset_: () => void
        _setTag_: (pkgName: string, tagValue: string, tagKey?: string) => void
    }
>

const setupExampleMonorepo = async (): Promise<YarnContext> => {
    const context = await setupMonorepo(
        {
            'pkg-1': {},
            'pkg-2': { devDependencies: [] },
            'pkg-3': { dependencies: ['pkg-2'] },
            'pkg-4': {},
            'pkg-5': { dependencies: ['pkg-4'] },
            'pkg-6': {
                dependencies: ['pkg-3', 'pkg-7'],
            },
            'pkg-7': {},
            'pkg-8': { version: '3.1.0' },
        },
        {
            root: {
                dependencies: {
                    '@tophat/conventional-changelog-config': '^0.5.0',
                },
            },
        },
    )
    return context
}

describe('Monodeploy (Dry Run)', () => {
    const monodeployConfig: MonodeployConfiguration = {
        cwd: '/tmp/to-be-overwritten-by-before-each',
        dryRun: true,
        noRegistry: false,
        autoCommit: false,
        autoCommitMessage: 'chore: release [skip ci]',
        git: {
            baseBranch: 'main',
            commitSha: 'HEAD',
            remote: 'origin',
            push: true,
            tag: true,
        },
        conventionalChangelogConfig: '@tophat/conventional-changelog-config',
        access: 'public',
        persistVersions: false,
        topological: false,
        topologicalDev: false,
        jobs: 0,
        forceWriteChangeFiles: false,
        maxConcurrentReads: 2,
        maxConcurrentWrites: 0,
        prerelease: false,
        prereleaseId: 'rc',
        prereleaseNPMTag: 'next',
    }

    beforeAll(async () => {
        process.env.MONODEPLOY_LOG_LEVEL = String(LOG_LEVELS.ERROR)
    })

    beforeEach(async () => {
        const context = await setupExampleMonorepo()
        monodeployConfig.cwd = npath.fromPortablePath(context.project.cwd)
    })

    afterEach(async () => {
        mockGit._reset_()
        mockNPM._reset_()
        try {
            await fs.rm(monodeployConfig.cwd, { recursive: true, force: true })
        } catch {}
    })

    afterAll(() => {
        delete process.env.MONODEPLOY_LOG_LEVEL
    })

    it('throws an error if invoked with invalid cwd', async () => {
        await expect(async () => {
            await monodeploy({
                ...monodeployConfig,
                cwd: String(undefined),
            })
        }).rejects.toThrow(/Invalid cwd/)
    })

    it('throws an error if invoked in a non-project', async () => {
        const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'non-workspace-'))
        try {
            await expect(async () => {
                await monodeploy({
                    ...monodeployConfig,
                    cwd: tmpDir,
                })
            }).rejects.toThrow(/No project/)
        } finally {
            try {
                await fs.rm(tmpDir, { recursive: true, force: true })
            } catch {}
        }
    })

    it('does not publish if no changes detected', async () => {
        const result = await monodeploy(monodeployConfig)
        expect(result).toEqual({})
        expect(mockGit._getPushedTags_()).toHaveLength(0)
    })

    it('publishes only changed workspaces', async () => {
        mockNPM._setTag_('pkg-1', '0.0.1')
        mockNPM._setTag_('pkg-2', '0.0.1')
        mockNPM._setTag_('pkg-3', '0.0.1')
        mockGit._commitFiles_('sha1', 'feat: some new feature!', ['./packages/pkg-1/README.md'])

        const result = await monodeploy(monodeployConfig)

        // pkg-1 is explicitly updated with minor bump
        expect(result['pkg-1'].version).toEqual('0.1.0')
        expect(result['pkg-1'].changelog).toEqual(expect.stringContaining('some new feature'))

        // pkg-2 and pkg-3 not in dependency graph
        expect(result['pkg-2']).toBeUndefined()
        expect(result['pkg-3']).toBeUndefined()

        // Not tags pushed in dry run
        expect(mockGit._getPushedTags_()).toHaveLength(0)
    })

    it('propagates dependant changes', async () => {
        mockNPM._setTag_('pkg-1', '0.0.1')
        mockNPM._setTag_('pkg-2', '0.0.1')
        mockNPM._setTag_('pkg-3', '0.0.1')
        mockGit._commitFiles_('sha1', 'feat: some new feature!\n\nBREAKING CHANGE: major bump!', [
            './packages/pkg-2/README.md',
        ])

        const result = await monodeploy(monodeployConfig)

        // pkg-1 is not in modified dependency graph
        expect(result['pkg-1']).toBeUndefined()

        // pkg-2 is the one explicitly updated with breaking change
        expect(result['pkg-2'].version).toEqual('1.0.0')
        expect(result['pkg-2'].changelog).toEqual(expect.stringContaining('some new feature'))

        // pkg-3 depends on pkg-2, and is updated as dependent
        expect(result['pkg-3'].version).toEqual('0.0.2')
        expect(result['pkg-3'].changelog).not.toEqual(expect.stringContaining('some new feature'))

        // Not tags pushed in dry run
        expect(mockGit._getPushedTags_()).toHaveLength(0)
    })

    it('defaults to 0.0.0 as base version for first publish if no version found in manifest', async () => {
        mockGit._commitFiles_('sha1', 'feat: some new feature!', ['./packages/pkg-1/README.md'])

        const result = await monodeploy(monodeployConfig)

        // pkg-1 is explicitly updated with minor bump
        expect(result['pkg-1'].version).toEqual('0.1.0')
        expect(result['pkg-1'].changelog).toEqual(expect.stringContaining('some new feature'))

        // pkg-2 and pkg-3 not in dependency graph
        expect(result['pkg-2']).toBeUndefined()
        expect(result['pkg-3']).toBeUndefined()

        // Not tags pushed in dry run
        expect(mockGit._getPushedTags_()).toHaveLength(0)
    })

    it('defaults to version from manifest if no version found in package registry', async () => {
        mockGit._commitFiles_('sha1', 'feat: some new feature!', ['./packages/pkg-8/README.md'])

        const result = await monodeploy(monodeployConfig)

        // pkg-1 is explicitly updated with minor bump
        expect(result['pkg-8'].version).toEqual('3.2.0')
        expect(result['pkg-8'].changelog).toEqual(expect.stringContaining('some new feature'))

        // Not tags pushed in dry run
        expect(mockGit._getPushedTags_()).toHaveLength(0)
    })

    it('updates changelog and changeset if forced', async () => {
        mockNPM._setTag_('pkg-1', '0.0.1')
        mockNPM._setTag_('pkg-2', '0.0.1')
        mockNPM._setTag_('pkg-3', '0.0.1')
        mockGit._commitFiles_('sha1', 'feat: some new feature!', ['./packages/pkg-1/README.md'])

        const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'changelog-'))
        const changelogFilename = await path.join(tempDir, 'changelog.md')
        const changesetFilename = await path.join(tempDir, 'changeset.json')

        try {
            const changelogTemplate = [
                '# Changelog',
                'Some blurb',
                '<!-- MONODEPLOY:BELOW -->',
                '## Old Versions',
                'Content',
            ].join('\n')
            await fs.writeFile(changelogFilename, changelogTemplate, {
                encoding: 'utf-8',
            })

            const result = await monodeploy({
                ...monodeployConfig,
                changelogFilename,
                changesetFilename,
                forceWriteChangeFiles: true,
            })

            // pkg-1 is explicitly updated with minor bump
            expect(result['pkg-1'].version).toEqual('0.1.0')

            const updatedChangelog = await fs.readFile(changelogFilename, {
                encoding: 'utf-8',
            })

            // assert it contains the new entry
            expect(updatedChangelog).toEqual(expect.stringContaining('some new feature'))

            // assert it contains the old entries
            expect(updatedChangelog).toEqual(expect.stringContaining('Old Versions'))

            const changeset = JSON.parse(
                await fs.readFile(changesetFilename, {
                    encoding: 'utf-8',
                }),
            )

            expect(changeset).toEqual(
                expect.objectContaining({
                    'pkg-1': expect.objectContaining({
                        version: '0.1.0',
                        changelog: expect.stringContaining('some new feature'),
                    }),
                }),
            )
        } finally {
            try {
                await fs.unlink(changelogFilename)
                await fs.rm(tempDir, { recursive: true, force: true })
            } catch {}
        }
    })
})
