import { promises as fs } from 'fs'
import path from 'path'

import * as git from '@monodeploy/git'
import { LOG_LEVELS } from '@monodeploy/logging'
import { setupMonorepo } from '@monodeploy/test-utils'
import type { MonodeployConfiguration } from '@monodeploy/types'
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

describe('Monodeploy Lifecycle Scripts', () => {
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
        topological: true,
        topologicalDev: true,
        jobs: 100,
        forceWriteChangeFiles: false,
        maxConcurrentReads: 4,
        maxConcurrentWrites: 3,
        prerelease: false,
        prereleaseId: 'rc',
        prereleaseNPMTag: 'next',
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
