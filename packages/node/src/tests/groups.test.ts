import { promises as fs } from 'fs'
import os from 'os'
import path from 'path'

import * as git from '@monodeploy/git'
import { LOG_LEVELS } from '@monodeploy/logging'
import { setupMonorepo } from '@monodeploy/test-utils'
import type { CommitMessage, MonodeployConfiguration, YarnContext } from '@monodeploy/types'
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
        _getRegistry_: () => {
            commits: CommitMessage[]
            filesModified: Map<string, string[]>
            tags: string[]
            pushedTags: string[]
            lastTaggedCommit?: string
            pushedCommits: string[]
            stagedFiles: string[]
        }
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
            'pkg-2': { devDependencies: [], raw: { nested: { group: 'even' } } },
            'pkg-3': { dependencies: ['pkg-2'], raw: { nested: { group: 'odd' } } },
            'pkg-4': { raw: { nested: { group: 'even' } } },
            'pkg-5': { dependencies: ['pkg-4'], raw: { nested: { group: 'odd' } } },
            'pkg-6': {
                dependencies: ['pkg-3', 'pkg-7'],
                raw: { nested: { group: 'even' } },
            },
            'pkg-7': { raw: { nested: { group: 'odd' } } },
            'pkg-8': { version: '3.1.0', raw: { nested: { group: 'even' } } },
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

describe('Monodeploy', () => {
    const monodeployConfig: MonodeployConfiguration = {
        cwd: '/tmp/to-be-overwritten-by-before-each',
        dryRun: false,
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
        maxConcurrentWrites: 2,
        prerelease: false,
        prereleaseId: 'rc',
        prereleaseNPMTag: 'next',
        packageGroupManifestField: 'nested.group',
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

    it('propagates dependant changes', async () => {
        mockNPM._setTag_('pkg-1', '0.0.1')
        mockNPM._setTag_('pkg-2', '0.0.1')
        mockNPM._setTag_('pkg-3', '0.0.1')
        mockNPM._setTag_('pkg-6', '0.0.1')
        mockGit._commitFiles_('sha1', 'feat: some new feature!\n\nBREAKING CHANGE: major bump!', [
            './packages/pkg-2/README.md',
        ])

        const result = await monodeploy(monodeployConfig)

        // pkg-1 is not in modified dependency graph
        expect(result['pkg-1']).toBeUndefined()

        // pkg-2 is the one explicitly updated with breaking change
        expect(result['pkg-2'].version).toBe('1.0.0')
        expect(result['pkg-2'].changelog).toEqual(expect.stringContaining('some new feature'))

        // pkg-3 depends on pkg-2, and is updated as dependent but in separate group (odd)
        expect(result['pkg-3'].version).toBe('0.0.2')
        expect(result['pkg-3'].changelog).toBeNull()

        // pkg-6 depends on pkg-3, and is updated as a transitive dependent but in same group as pkg-2 (even)
        expect(result['pkg-6'].version).toBe('1.0.0')
        expect(result['pkg-6'].changelog).toBeNull()

        // Not tags pushed in dry run
        expect(mockGit._getPushedTags_()).toEqual(['even@1.0.0', 'odd@0.0.2'])
    })

    it('publishes changed workspaces with distinct version stategies and commits', async () => {
        mockNPM._setTag_('pkg-1', '0.0.1')
        mockNPM._setTag_('pkg-2', '0.0.1')
        mockNPM._setTag_('pkg-3', '0.0.1')
        mockNPM._setTag_('pkg-6', '2.0.1')
        mockGit._commitFiles_('sha1', 'feat: some new feature!', ['./packages/pkg-1/README.md'])
        mockGit._commitFiles_('sha2', 'fix: a different fix!', ['./packages/pkg-2/README.md'])

        const result = await monodeploy(monodeployConfig)

        // pkg-1 is explicitly updated with minor bump
        expect(result['pkg-1'].version).toBe('0.1.0')
        expect(result['pkg-1'].changelog).toEqual(expect.stringContaining('some new feature'))

        // pkg-2 is explicitly updated with patch bump but is in the same group as pkg-6
        expect(result['pkg-2'].version).toBe('2.0.2')
        expect(result['pkg-2'].changelog).not.toEqual(expect.stringContaining('some new feature'))
        expect(result['pkg-2'].changelog).toEqual(expect.stringContaining('a different fix'))

        // pkg-3 depends on pkg-2
        expect(result['pkg-3'].version).toBe('0.0.2')
        expect(result['pkg-3'].changelog).toBeNull()

        // pkg-6 depends on pkg-3, and is updated as a transitive dependent (but same group as pkg-2)
        expect(result['pkg-6'].version).toBe('2.0.2')
        expect(result['pkg-6'].changelog).toBeNull()

        expect(mockGit._getPushedTags_()).toEqual(['pkg-1@0.1.0', 'even@2.0.2', 'odd@0.0.2'])
    })

    it('updates changelog and changeset', async () => {
        mockNPM._setTag_('pkg-1', '0.0.1')
        mockNPM._setTag_('pkg-2', '0.0.1')
        mockNPM._setTag_('pkg-3', '0.0.1')
        mockGit._commitFiles_('sha1', 'feat: some new feature!', ['./packages/pkg-2/README.md'])

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
            })

            // pkg-2 is explicitly updated with minor bump
            expect(result['pkg-2'].version).toBe('0.1.0')

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
                    'pkg-2': expect.objectContaining({
                        version: '0.1.0',
                        changelog: expect.stringContaining('some new feature'),
                        strategy: 'minor',
                        previousVersion: '0.0.1',
                        group: 'even',
                        tag: 'even@0.1.0',
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

    it('supports prereleases', async () => {
        mockNPM._setTag_('pkg-1', '1.0.1', 'latest')
        mockNPM._setTag_('pkg-2', '2.3.0', 'latest')
        mockNPM._setTag_('pkg-2', '2.4.0-alpha.3', 'canary')
        mockNPM._setTag_('pkg-3', '6.0.0', 'latest')
        mockNPM._setTag_('pkg-3', '7.0.0-alpha.0', 'canary')
        mockNPM._setTag_('pkg-6', '0.0.4', 'latest')

        mockGit._commitFiles_('sha1', 'feat: some new feature!', ['./packages/pkg-2/README.md'])

        const result = await monodeploy({
            ...monodeployConfig,
            prerelease: true,
            prereleaseId: 'alpha',
            prereleaseNPMTag: 'canary',
        })

        // pkg-1 is not in modified dependency graph
        expect(result['pkg-1']).toBeUndefined()

        // pkg-2 is the one explicitly updated with feature change
        expect(result['pkg-2'].version).toBe('2.4.0-alpha.4')
        expect(result['pkg-2'].changelog).toEqual(expect.stringContaining('some new feature'))

        // pkg-3 depends on pkg-2, and is updated as dependent
        expect(result['pkg-3'].version).toBe('7.0.0-alpha.1')
        expect(result['pkg-3'].changelog).toBeNull()

        // pkg-6 depends on pkg-3, and is updated as a transitive dependent
        expect(result['pkg-6'].version).toBe('2.4.0-alpha.4')
        expect(result['pkg-6'].changelog).toBeNull()

        expect(mockGit._getPushedTags_()).toEqual(['even@2.4.0-alpha.4', 'odd@7.0.0-alpha.1'])
    })
})
