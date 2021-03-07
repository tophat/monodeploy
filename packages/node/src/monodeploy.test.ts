import { promises as fs } from 'fs'
import os from 'os'
import path from 'path'

import { getPluginConfiguration } from '@yarnpkg/cli'
import { Configuration, Project, Workspace } from '@yarnpkg/core'
import { PortablePath } from '@yarnpkg/fslib'
import * as npm from '@yarnpkg/plugin-npm'

import setupMonorepo from '@monodeploy/test-utils/setupMonorepo'
import * as git from 'monodeploy-git'
import {
    backupPackageJsons,
    clearBackupCache,
    restorePackageJsons,
} from 'monodeploy-io'
import logger, { LOG_LEVELS } from 'monodeploy-logging'
import type { MonodeployConfiguration, YarnContext } from 'monodeploy-types'

import monodeploy from '.'

jest.mock('@yarnpkg/plugin-npm')
jest.mock('monodeploy-git')

const mockGit = git as jest.Mocked<
    typeof git & {
        _reset_: () => void
        _commitFiles_: (sha: string, commit: string, files: string[]) => void
        _getPushedTags_: () => string[]
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
            'pkg-2': {},
            'pkg-3': { dependencies: ['pkg-2'] },
            'pkg-4': {},
            'pkg-5': { dependencies: ['pkg-4'] },
            'pkg-6': {
                dependencies: ['pkg-3', 'pkg-7'],
            },
            'pkg-7': {},
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
        git: {
            baseBranch: 'master',
            commitSha: 'HEAD',
            remote: 'origin',
            push: true,
        },
        conventionalChangelogConfig: '@tophat/conventional-changelog-config',
        access: 'public',
        persistVersions: false,
        topological: false,
        topologicalDev: false,
        jobs: 0,
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
        cwd: '/tmp/to-be-overwritten-by-before-each',
        dryRun: false,
        git: {
            baseBranch: 'master',
            commitSha: 'HEAD',
            remote: 'origin',
            push: true,
        },
        conventionalChangelogConfig: '@tophat/conventional-changelog-config',
        access: 'public',
        persistVersions: false,
        topological: false,
        topologicalDev: false,
        jobs: 0,
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
        const spyError = jest.spyOn(logger, 'error').mockImplementation()
        const spyPublish = jest
            .spyOn(npm.npmHttpUtils, 'put')
            .mockImplementation(() => {
                throw new Error('Fail to publish!')
            })

        mockNPM._setTag_('pkg-1', '0.0.1')
        mockGit._commitFiles_('sha1', 'feat: some new feature!', [
            './packages/pkg-1/README.md',
        ])

        await expect(async () => {
            await monodeploy(monodeployConfig)
        }).rejects.toThrow()

        expect(spyError).toHaveBeenCalledWith(
            expect.stringContaining('Monodeploy failed'),
        )
        spyError.mockRestore()
        spyPublish.mockRestore()
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
                if (tempDir) {
                    await fs.rm(tempDir, { recursive: true, force: true })
                }
            } catch {}
        }
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
        git: {
            baseBranch: 'master',
            commitSha: 'HEAD',
            remote: 'origin',
            push: true,
        },
        conventionalChangelogConfig: '@tophat/conventional-changelog-config',
        access: 'public',
        persistVersions: false,
        topological: false,
        topologicalDev: false,
        jobs: 0,
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
