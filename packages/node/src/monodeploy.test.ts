import { promises as fs } from 'fs'
import os from 'os'
import path from 'path'

import { getPluginConfiguration } from '@yarnpkg/cli'
import { Configuration, Project, Workspace } from '@yarnpkg/core'
import { PortablePath } from '@yarnpkg/fslib'
import * as npm from '@yarnpkg/plugin-npm'

import * as git from '@monodeploy/git'
import {
    backupPackageJsons,
    clearBackupCache,
    restorePackageJsons,
} from '@monodeploy/io'
import { LOG_LEVELS } from '@monodeploy/logging'
import { setupMonorepo } from '@monodeploy/test-utils'
import type { MonodeployConfiguration, YarnContext } from '@monodeploy/types'

import monodeploy from '.'

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
            baseBranch: 'master',
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
    }

    beforeAll(async () => {
        process.env.MONODEPLOY_LOG_LEVEL = String(LOG_LEVELS.ERROR)
    })

    beforeEach(async () => {
        const context = await setupExampleMonorepo()
        monodeployConfig.cwd = context.project.cwd
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
        const tmpDir = await fs.mkdtemp(
            path.join(os.tmpdir(), 'non-workspace-'),
        )
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

    it('defaults to 0.0.0 as base version for first publish if no version found in manifest', async () => {
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

    it('defaults to version from manifest if no version found in package registry', async () => {
        mockGit._commitFiles_('sha1', 'feat: some new feature!', [
            './packages/pkg-8/README.md',
        ])

        const result = await monodeploy(monodeployConfig)

        // pkg-1 is explicitly updated with minor bump
        expect(result['pkg-8'].version).toEqual('3.2.0')
        expect(result['pkg-8'].changelog).toEqual(
            expect.stringContaining('some new feature'),
        )

        // Not tags pushed in dry run
        expect(mockGit._getPushedTags_()).toHaveLength(0)
    })

    it('updates changelog and changeset if forced', async () => {
        mockNPM._setTag_('pkg-1', '0.0.1')
        mockNPM._setTag_('pkg-2', '0.0.1')
        mockNPM._setTag_('pkg-3', '0.0.1')
        mockGit._commitFiles_('sha1', 'feat: some new feature!', [
            './packages/pkg-1/README.md',
        ])

        const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'changelog-'))
        const changelogFilename = await path.join(tempDir, 'changelog.md')
        const changesetFilename = await path.join(tempDir, 'changeset.json')

        try {
            const changelogTemplate = [
                `# Changelog`,
                `Some blurb`,
                `<!-- MONODEPLOY:BELOW -->`,
                `## Old Versions`,
                `Content`,
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
            expect(updatedChangelog).toEqual(
                expect.stringContaining('some new feature'),
            )

            // assert it contains the old entries
            expect(updatedChangelog).toEqual(
                expect.stringContaining('Old Versions'),
            )

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

describe('Monodeploy', () => {
    const monodeployConfig: MonodeployConfiguration = {
        cwd: '/tmp/to-be-overwritten-by-before-each',
        dryRun: false,
        noRegistry: false,
        autoCommit: false,
        autoCommitMessage: 'chore: release [skip ci]',
        git: {
            baseBranch: 'master',
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
    }

    beforeAll(async () => {
        process.env.MONODEPLOY_LOG_LEVEL = String(LOG_LEVELS.ERROR)
    })

    beforeEach(async () => {
        const context = await setupExampleMonorepo()
        monodeployConfig.cwd = context.project.cwd
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

    it('logs an error if publishing fails', async () => {
        const spyPublish = jest
            .spyOn(npm.npmHttpUtils, 'put')
            .mockImplementation(() => {
                throw new Error(
                    'Artificially induced error in a test! This is meant to fail! Ignore this.',
                )
            })

        mockNPM._setTag_('pkg-1', '0.0.1')
        mockGit._commitFiles_('sha1', 'feat: some new feature!', [
            './packages/pkg-1/README.md',
        ])

        await expect(async () => {
            await monodeploy(monodeployConfig)
        }).rejects.toThrow()

        spyPublish.mockRestore()
    })

    it('does not publish if no changes detected', async () => {
        const result = await monodeploy(monodeployConfig)
        expect(result).toEqual({})
        expect(mockGit._getPushedTags_()).toHaveLength(0)
    })

    it('does not use npm registry if in no registry mode', async () => {
        mockNPM._setTag_('pkg-8', '0.2.3')
        mockGit._commitFiles_('sha1', 'feat: some new feature!', [
            './packages/pkg-8/README.md',
        ])

        const result = await monodeploy({
            ...monodeployConfig,
            noRegistry: true,
        })

        // pkg-8 is explicitly updated with minor bump
        // pkg-8's manifest version is 3.1.0
        expect(result['pkg-8'].version).toEqual('3.2.0')
        expect(result['pkg-8'].changelog).toEqual(
            expect.stringContaining('some new feature'),
        )

        expect(mockGit._getPushedTags_()).toEqual(['pkg-8@3.2.0'])
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

        expect(mockGit._getTags_()).toEqual(['pkg-1@0.1.0'])
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

    it('does not create tags if git tag mode disabled', async () => {
        mockNPM._setTag_('pkg-1', '0.0.1')
        mockNPM._setTag_('pkg-2', '0.0.1')
        mockNPM._setTag_('pkg-3', '0.0.1')
        mockGit._commitFiles_('sha1', 'feat: some new feature!', [
            './packages/pkg-1/README.md',
        ])

        const result = await monodeploy({
            ...monodeployConfig,
            git: { ...monodeployConfig.git, push: true, tag: false },
        })

        // pkg-1 is explicitly updated with minor bump
        expect(result['pkg-1'].version).toEqual('0.1.0')

        // push is enabled but tagging is disabled, so no pushed tags
        expect(mockGit._getPushedTags_()).toEqual([])
        expect(mockGit._getTags_()).toEqual([])
    })

    it('propagates dependant changes', async () => {
        mockNPM._setTag_('pkg-1', '0.0.1')
        mockNPM._setTag_('pkg-2', '0.0.1')
        mockNPM._setTag_('pkg-3', '0.0.1')
        mockNPM._setTag_('pkg-6', '0.0.1')
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

        // pkg-6 depends on pkg-3, and is updated as a transitive dependent
        expect(result['pkg-6'].version).toEqual('0.0.2')
        expect(result['pkg-6'].changelog).not.toEqual(
            expect.stringContaining('some new feature'),
        )

        // Not tags pushed in dry run
        expect(mockGit._getPushedTags_()).toEqual([
            'pkg-2@1.0.0',
            'pkg-3@0.0.2',
            'pkg-6@0.0.2',
        ])
    })

    it('publishes changed workspaces with distinct version stategies and commits', async () => {
        mockNPM._setTag_('pkg-1', '0.0.1')
        mockNPM._setTag_('pkg-2', '0.0.1')
        mockNPM._setTag_('pkg-3', '0.0.1')
        mockNPM._setTag_('pkg-6', '0.0.1')
        mockGit._commitFiles_('sha1', 'feat: some new feature!', [
            './packages/pkg-1/README.md',
        ])
        mockGit._commitFiles_('sha2', 'fix: a different fix!', [
            './packages/pkg-2/README.md',
        ])

        const result = await monodeploy(monodeployConfig)

        // pkg-1 is explicitly updated with minor bump
        expect(result['pkg-1'].version).toEqual('0.1.0')
        expect(result['pkg-1'].changelog).toEqual(
            expect.stringContaining('some new feature'),
        )

        // pkg-2 is explicitly updated with patch bump
        expect(result['pkg-2'].version).toEqual('0.0.2')
        expect(result['pkg-2'].changelog).not.toEqual(
            expect.stringContaining('some new feature'),
        )
        expect(result['pkg-2'].changelog).toEqual(
            expect.stringContaining('a different fix'),
        )

        // pkg-3 depends on pkg-2
        expect(result['pkg-3'].version).toEqual('0.0.2')
        expect(result['pkg-3'].changelog).not.toEqual(
            expect.stringContaining('some new feature'),
        )
        expect(result['pkg-3'].changelog).not.toEqual(
            expect.stringContaining('a different fix'),
        )

        // pkg-6 depends on pkg-3, and is updated as a transitive dependent
        expect(result['pkg-6'].version).toEqual('0.0.2')
        expect(result['pkg-6'].changelog).not.toEqual(
            expect.stringContaining('some new feature'),
        )

        expect(mockGit._getPushedTags_()).toEqual([
            'pkg-1@0.1.0',
            'pkg-2@0.0.2',
            'pkg-3@0.0.2',
            'pkg-6@0.0.2',
        ])
    })

    it('updates changelog and changeset', async () => {
        mockNPM._setTag_('pkg-1', '0.0.1')
        mockNPM._setTag_('pkg-2', '0.0.1')
        mockNPM._setTag_('pkg-3', '0.0.1')
        mockGit._commitFiles_('sha1', 'feat: some new feature!', [
            './packages/pkg-1/README.md',
        ])

        const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'changelog-'))
        const changelogFilename = await path.join(tempDir, 'changelog.md')
        const changesetFilename = await path.join(tempDir, 'changeset.json')

        try {
            const changelogTemplate = [
                `# Changelog`,
                `Some blurb`,
                `<!-- MONODEPLOY:BELOW -->`,
                `## Old Versions`,
                `Content`,
            ].join('\n')
            await fs.writeFile(changelogFilename, changelogTemplate, {
                encoding: 'utf-8',
            })

            const result = await monodeploy({
                ...monodeployConfig,
                changelogFilename,
                changesetFilename,
            })

            // pkg-1 is explicitly updated with minor bump
            expect(result['pkg-1'].version).toEqual('0.1.0')

            const updatedChangelog = await fs.readFile(changelogFilename, {
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

    it('writes the changeset to standard out if - specified', async () => {
        mockNPM._setTag_('pkg-1', '0.0.1')
        mockNPM._setTag_('pkg-2', '0.0.1')
        mockNPM._setTag_('pkg-3', '0.0.1')
        mockGit._commitFiles_('sha1', 'feat: some new feature!', [
            './packages/pkg-1/README.md',
        ])

        const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'changelog-'))
        const changesetFilename = await path.join(tempDir, 'changeset.json')

        const spyConsoleLog = jest.spyOn(console, 'log')

        try {
            const result = await monodeploy({
                ...monodeployConfig,
                changesetFilename: '-',
            })

            // pkg-1 is explicitly updated with minor bump
            expect(result['pkg-1'].version).toEqual('0.1.0')

            // changeset file should not exist
            await expect(fs.stat(changesetFilename)).rejects.toThrow()

            // assert stdout is equal to the returned result
            expect(JSON.parse(spyConsoleLog.mock.calls[0][0])).toEqual(result)

            expect(result).toEqual(
                expect.objectContaining({
                    'pkg-1': expect.objectContaining({
                        version: '0.1.0',
                        changelog: expect.stringContaining('some new feature'),
                    }),
                }),
            )
        } finally {
            try {
                await fs.rm(tempDir, { recursive: true, force: true })
            } catch {}
        }

        spyConsoleLog.mockRestore()
    })

    it('does not restore package.jsons if persist versions is true', async () => {
        const config = { ...monodeployConfig, persistVersions: true }
        const cwd = path.resolve(process.cwd(), config.cwd) as PortablePath
        const configuration = await Configuration.find(
            cwd,
            getPluginConfiguration(),
        )
        const { project, workspace } = await Project.find(configuration, cwd)
        await project.restoreInstallState()
        const context: YarnContext = {
            configuration,
            project,
            workspace: workspace as Workspace,
            report: null,
        }

        const testBackupKey = await backupPackageJsons(config, context)

        try {
            mockNPM._setTag_('pkg-1', '0.0.1')
            mockNPM._setTag_('pkg-2', '0.0.1')
            mockNPM._setTag_('pkg-3', '0.0.1')
            mockGit._commitFiles_('sha1', 'feat: some new feature!', [
                './packages/pkg-1/README.md',
            ])

            const result = await monodeploy(config)

            // pkg-1 is explicitly updated with minor bump
            expect(result['pkg-1'].version).toEqual('0.1.0')
            expect(result['pkg-1'].changelog).toEqual(
                expect.stringContaining('some new feature'),
            )

            // pkg-2 and pkg-3 not in dependency graph
            expect(result['pkg-2']).toBeUndefined()
            expect(result['pkg-3']).toBeUndefined()

            expect(mockGit._getPushedTags_()).toEqual(['pkg-1@0.1.0'])

            const readPackageVersion = async pkg => {
                const packageJsonPath = path.join(
                    config.cwd,
                    'packages',
                    pkg,
                    'package.json',
                )
                return JSON.parse(
                    await fs.readFile(packageJsonPath, { encoding: 'utf-8' }),
                )
            }

            // check package.jsons, and then restore the
            const pkg1 = await readPackageVersion('pkg-1')
            expect(pkg1.version).toEqual(result['pkg-1'].version)

            // unchanged packages don't need to be updated
            const pkg2 = await readPackageVersion('pkg-2')
            expect(pkg2.version).toEqual('0.0.0')
        } finally {
            await restorePackageJsons(config, context, testBackupKey)
            await clearBackupCache([testBackupKey])
        }
    })
})

describe('Monodeploy Lifecycle Scripts', () => {
    const monodeployConfig: MonodeployConfiguration = {
        cwd: '/tmp/to-be-overwritten-by-before-each',
        dryRun: false,
        noRegistry: false,
        autoCommit: false,
        autoCommitMessage: 'chore: release [skip ci]',
        git: {
            baseBranch: 'master',
            commitSha: 'HEAD',
            remote: 'origin',
            push: true,
            tag: true,
        },
        conventionalChangelogConfig: '@tophat/conventional-changelog-config',
        access: 'public',
        persistVersions: false,
        topological: true,
        topologicalDev: true,
        jobs: 100,
        forceWriteChangeFiles: false,
        maxConcurrentReads: 4,
        maxConcurrentWrites: 3,
    }

    const resolvePackagePath = (pkgName: string, filename: string) =>
        path.resolve(
            path.join(monodeployConfig.cwd, 'packages', pkgName),
            filename,
        )

    beforeAll(async () => {
        process.env.MONODEPLOY_LOG_LEVEL = String(LOG_LEVELS.ERROR)
    })

    beforeEach(async () => {
        const scripts = {
            prepack: 'node -p "process.hrtime.bigint()" > .prepack.test.tmp',
            prepare: 'node -p "process.hrtime.bigint()" > .prepare.test.tmp',
            prepublish:
                'node -p "process.hrtime.bigint()" > .prepublish.test.tmp',
            postpack: 'node -p "process.hrtime.bigint()" > .postpack.test.tmp',
            postpublish:
                'node -p "process.hrtime.bigint()" > .postpublish.test.tmp',
        }
        const context = await setupMonorepo(
            {
                'pkg-1': {},
                'pkg-2': {},
                'pkg-3': { dependencies: ['pkg-2'] },
                'pkg-4': { scripts },
                'pkg-5': { dependencies: ['pkg-4'], scripts },
                'pkg-6': {
                    dependencies: ['pkg-3', 'pkg-7'],
                    devDependencies: ['pkg-1'],
                    scripts,
                },
                'pkg-7': { scripts },
            },
            {
                root: {
                    dependencies: {
                        '@tophat/conventional-changelog-config': '^0.5.0',
                    },
                },
            },
        )
        monodeployConfig.cwd = context.project.cwd
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

    it('runs lifecycle scripts for changed workspaces', async () => {
        mockNPM._setTag_('pkg-1', '0.0.1')
        mockNPM._setTag_('pkg-2', '0.1.1')
        mockNPM._setTag_('pkg-3', '0.0.1')
        mockNPM._setTag_('pkg-4', '0.0.1')
        mockNPM._setTag_('pkg-5', '0.0.1')
        mockNPM._setTag_('pkg-6', '0.0.1')
        mockGit._commitFiles_('sha1', 'feat: some new feature!', [
            './packages/pkg-4/README.md',
        ])
        mockGit._commitFiles_('sha1', 'feat: some other feature!', [
            './packages/pkg-2/README.md',
        ])

        const result = await monodeploy(monodeployConfig)

        // pkg-4 is explicitly updated with minor bump
        expect(result['pkg-4'].version).toEqual('0.1.0')
        expect(result['pkg-4'].changelog).toEqual(
            expect.stringContaining('some new feature'),
        )

        // pkg-2 is explicitly bumped with minor
        expect(result['pkg-2'].version).toEqual('0.2.0')
        expect(result['pkg-2'].changelog).toEqual(
            expect.stringContaining('some other feature'),
        )

        // pkg-5 depends on pkg-4, so it'll be bumped as a dependant
        // pkg-3 is bumped because it depends on pkg-2
        // pkg-6 is bumped because it depends on pkg-3
        expect(mockGit._getPushedTags_()).toEqual([
            'pkg-2@0.2.0',
            'pkg-3@0.0.2',
            'pkg-4@0.1.0',
            'pkg-5@0.0.2',
            'pkg-6@0.0.2',
        ])

        const filesToCheck = [
            '.prepack.test.tmp',
            '.prepare.test.tmp',
            '.prepublish.test.tmp',
            '.postpack.test.tmp',
            '.postpublish.test.tmp',
        ]

        for (const fileToCheck of filesToCheck) {
            const filename = resolvePackagePath('pkg-4', fileToCheck)
            const stat = await fs.stat(filename)
            expect(stat).toBeDefined()
        }
    })
})
