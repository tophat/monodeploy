import { promises as fs } from 'fs'

import * as git from '@monodeploy/git'
import { LOG_LEVELS } from '@monodeploy/logging'
import { setupMonorepo } from '@monodeploy/test-utils'
import { type MonodeployConfiguration, RegistryMode, type YarnContext } from '@monodeploy/types'
import { npath } from '@yarnpkg/fslib'
import * as npm from '@yarnpkg/plugin-npm'

import monodeploy from '../..'

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
        },
        {
            root: {
                name: null, // setupMonorepo sets 'name' to undefined if explicitly set to null
                private: true,
                dependencies: {
                    '@tophat/conventional-changelog-config': '^0.5.0',
                },
            },
        },
    )
    return context
}

describe('Optional Workspace Identities', () => {
    const monodeployConfig: MonodeployConfiguration = {
        cwd: '/tmp/to-be-overwritten-by-before-each',
        dryRun: true,
        registryMode: RegistryMode.NPM,
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

    it('does not require name on private workspaces', async () => {
        mockNPM._setTag_('pkg-1', '0.0.1')
        mockGit._commitFiles_('sha1', 'feat: some new feature!', ['./packages/pkg-1/README.md'])
        mockGit._commitFiles_('sha1', 'feat: modify top-level', ['./package.json'])

        const result = await monodeploy(monodeployConfig)

        // pkg-1 is explicitly updated with minor bump
        expect(result['pkg-1'].version).toBe('0.1.0')
        expect(result['pkg-1'].changelog).toEqual(expect.stringContaining('some new feature'))

        // Not tags pushed in dry run
        expect(mockGit._getPushedTags_()).toHaveLength(0)
    })
})
