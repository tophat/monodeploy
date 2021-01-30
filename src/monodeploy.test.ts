import { promises as fs } from 'fs'
import os from 'os'
import path from 'path'

import * as mockNPM from '@yarnpkg/plugin-npm'

import { LOG_LEVELS } from './logging'
import monodeploy from './monodeploy'
import type { MonodeployConfiguration } from './types'
import * as mockGit from './utils/git'

jest.mock('@yarnpkg/plugin-npm')
jest.mock('./utils/git')

describe('Monodeploy (Dry Run)', () => {
    const monodeployConfig: MonodeployConfiguration = {
        cwd: path.resolve(process.cwd(), 'example-monorepo'),
        dryRun: true,
        git: {
            baseBranch: 'master',
            commitSha: 'HEAD',
            remote: 'origin',
            push: true,
        },
        conventionalChangelogConfig: '@tophat/conventional-changelog-config',
        access: 'public',
    }

    beforeAll(async () => {
        process.env.MONODEPLOY_LOG_LEVEL = LOG_LEVELS.ERROR
    })

    afterEach(() => {
        mockGit._reset_()
        mockNPM._reset_()
    })

    afterAll(() => {
        delete process.env.MONODEPLOY_LOG_LEVEL
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
        mockGit._commitFiles_('sha1', 'feat: some new feature!', [
            './packages/pkg-1/README.md',
        ])

        const result = await monodeploy(monodeployConfig)

        // pkg-1 is explicitly updated with minor bump
        expect(result['pkg-1'].version).toEqual('0.1.0')
        expect(result['pkg-1'].changelog).toEqual(
            expect.stringContaining('some new feature'),
        )

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
        mockGit._commitFiles_(
            'sha1',
            'feat: some new feature!\n\nBREAKING CHANGE: major bump!',
            ['./packages/pkg-2/README.md'],
        )

        const result = await monodeploy(monodeployConfig)

        // pkg-1 is not in modified dependency graph
        expect(result['pkg-1']).toBeUndefined()

        // pkg-2 is the one explicitly updated with breaking change
        expect(result['pkg-2'].version).toEqual('1.0.0')
        expect(result['pkg-2'].changelog).toEqual(
            expect.stringContaining('some new feature'),
        )

        // pkg-3 depends on pkg-2, and is updated as dependent
        expect(result['pkg-3'].version).toEqual('0.0.2')
        expect(result['pkg-3'].changelog).not.toEqual(
            expect.stringContaining('some new feature'),
        )

        // Not tags pushed in dry run
        expect(mockGit._getPushedTags_()).toHaveLength(0)
    })

    it('defaults to 0.0.0 as base version for first publish', async () => {
        mockGit._commitFiles_('sha1', 'feat: some new feature!', [
            './packages/pkg-1/README.md',
        ])

        const result = await monodeploy(monodeployConfig)

        // pkg-1 is explicitly updated with minor bump
        expect(result['pkg-1'].version).toEqual('0.1.0')
        expect(result['pkg-1'].changelog).toEqual(
            expect.stringContaining('some new feature'),
        )

        // pkg-2 and pkg-3 not in dependency graph
        expect(result['pkg-2']).toBeUndefined()
        expect(result['pkg-3']).toBeUndefined()

        // Not tags pushed in dry run
        expect(mockGit._getPushedTags_()).toHaveLength(0)
    })
})

describe('Monodeploy', () => {
    const monodeployConfig: MonodeployConfiguration = {
        cwd: path.resolve(process.cwd(), 'example-monorepo'),
        dryRun: false,
        git: {
            baseBranch: 'master',
            commitSha: 'HEAD',
            remote: 'origin',
            push: true,
        },
        conventionalChangelogConfig: '@tophat/conventional-changelog-config',
        access: 'public',
    }

    beforeAll(async () => {
        process.env.MONODEPLOY_LOG_LEVEL = LOG_LEVELS.ERROR
    })

    afterEach(() => {
        mockGit._reset_()
        mockNPM._reset_()
    })

    afterAll(() => {
        delete process.env.MONODEPLOY_LOG_LEVEL
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
        mockGit._commitFiles_('sha1', 'feat: some new feature!', [
            './packages/pkg-1/README.md',
        ])

        const result = await monodeploy(monodeployConfig)

        // pkg-1 is explicitly updated with minor bump
        expect(result['pkg-1'].version).toEqual('0.1.0')
        expect(result['pkg-1'].changelog).toEqual(
            expect.stringContaining('some new feature'),
        )

        // pkg-2 and pkg-3 not in dependency graph
        expect(result['pkg-2']).toBeUndefined()
        expect(result['pkg-3']).toBeUndefined()

        expect(mockGit._getPushedTags_()).toEqual(['pkg-1@0.1.0'])
    })

    it('does not push tags if push disabled', async () => {
        mockNPM._setTag_('pkg-1', '0.0.1')
        mockNPM._setTag_('pkg-2', '0.0.1')
        mockNPM._setTag_('pkg-3', '0.0.1')
        mockGit._commitFiles_('sha1', 'feat: some new feature!', [
            './packages/pkg-1/README.md',
        ])

        const result = await monodeploy({
            ...monodeployConfig,
            git: { ...monodeployConfig.git, push: false },
        })

        // pkg-1 is explicitly updated with minor bump
        expect(result['pkg-1'].version).toEqual('0.1.0')

        // push is disabled, so no pushed tags
        expect(mockGit._getPushedTags_()).toEqual([])
    })

    it('propagates dependant changes', async () => {
        mockNPM._setTag_('pkg-1', '0.0.1')
        mockNPM._setTag_('pkg-2', '0.0.1')
        mockNPM._setTag_('pkg-3', '0.0.1')
        mockGit._commitFiles_(
            'sha1',
            'feat: some new feature!\n\nBREAKING CHANGE: major bump!',
            ['./packages/pkg-2/README.md'],
        )

        const result = await monodeploy(monodeployConfig)

        // pkg-1 is not in modified dependency graph
        expect(result['pkg-1']).toBeUndefined()

        // pkg-2 is the one explicitly updated with breaking change
        expect(result['pkg-2'].version).toEqual('1.0.0')
        expect(result['pkg-2'].changelog).toEqual(
            expect.stringContaining('some new feature'),
        )

        // pkg-3 depends on pkg-2, and is updated as dependent
        expect(result['pkg-3'].version).toEqual('0.0.2')
        expect(result['pkg-3'].changelog).not.toEqual(
            expect.stringContaining('some new feature'),
        )

        // Not tags pushed in dry run
        expect(mockGit._getPushedTags_()).toEqual([
            'pkg-2@1.0.0',
            'pkg-3@0.0.2',
        ])
    })

    it('updates changelog', async () => {
        mockNPM._setTag_('pkg-1', '0.0.1')
        mockNPM._setTag_('pkg-2', '0.0.1')
        mockNPM._setTag_('pkg-3', '0.0.1')
        mockGit._commitFiles_('sha1', 'feat: some new feature!', [
            './packages/pkg-1/README.md',
        ])

        const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'changelog-'))
        const tempFile = await path.join(tempDir, 'changelog.md')

        try {
            const changelogTemplate = [
                `# Changelog`,
                `Some blurb`,
                `<!-- MONODEPLOY:BELOW -->`,
                `## Old Versions`,
                `Content`,
            ].join('\n')
            await fs.writeFile(tempFile, changelogTemplate, {
                encoding: 'utf-8',
            })

            const result = await monodeploy({
                ...monodeployConfig,
                changelogFilename: tempFile,
            })

            // pkg-1 is explicitly updated with minor bump
            expect(result['pkg-1'].version).toEqual('0.1.0')

            const updatedChangelog = await fs.readFile(tempFile, {
                encoding: 'utf-8',
            })

            // assert it contains the new entry
            expect(updatedChangelog).toEqual(
                expect.stringContaining('some new feature'),
            )

            // assert it contains the old entries
            expect(updatedChangelog).toEqual(
                expect.stringContaining('Old Versions'),
            )
        } finally {
            try {
                if (tempFile) await fs.unlink(tempFile)
                if (tempDir) await fs.rmdir(tempDir)
            } catch {
                /* ignore */
            }
        }
    })
})
