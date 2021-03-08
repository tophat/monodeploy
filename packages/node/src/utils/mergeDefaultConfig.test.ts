import * as npm from '@yarnpkg/plugin-npm'

import * as git from '@monodeploy/git'
import { LOG_LEVELS } from '@monodeploy/logging'
import { MonodeployConfiguration } from '@monodeploy/types'

import mergeDefaultConfig from './mergeDefaultConfig'

jest.mock('@yarnpkg/plugin-npm')
jest.mock('@monodeploy/git')

const mockNPM = npm as jest.Mocked<
    typeof npm & {
        _reset_: () => void
        _setTag_: (pkgName: string, tagValue: string, tagKey?: string) => void
    }
>
const mockGit = git as jest.Mocked<
    typeof git & {
        _reset_: () => void
        _commitFiles_: (sha: string, commit: string, files: string[]) => void
        _getPushedTags_: () => string[]
    }
>

describe('Config Merging', () => {
    beforeAll(async () => {
        process.env.MONODEPLOY_LOG_LEVEL = String(LOG_LEVELS.ERROR)
    })

    afterEach(() => {
        mockGit._reset_()
        mockNPM._reset_()
    })

    afterAll(() => {
        delete process.env.MONODEPLOY_LOG_LEVEL
    })

    it('resolves git base branch and sha', async () => {
        mockGit._commitFiles_('sha1', 'feat: some new feature!', [
            './packages/pkg-1/README.md',
        ])
        mockGit.gitTag('v1.0.0', { cwd: '/tmp' })

        const merged = await mergeDefaultConfig({ cwd: '/tmp' })
        expect(merged.git.baseBranch).toEqual('sha1')
        expect(merged.git.commitSha).toEqual('sha:HEAD')
    })

    it('uses supplied config', async () => {
        const config: MonodeployConfiguration = {
            cwd: '/tmp',
            registryUrl: 'https://registry.example/',
            dryRun: true,
            git: {
                baseBranch: 'master',
                commitSha: 'HEAD',
                remote: 'origin',
                push: true,
            },
            conventionalChangelogConfig:
                '@tophat/conventional-changelog-config',
            changesetFilename: '/tmp/changeset.json',
            changelogFilename: '/tmp/changelog.md',
            forceWriteChangeFiles: false,
            access: 'public',
            persistVersions: true,
            topological: true,
            topologicalDev: true,
            jobs: 5,
        }

        const merged = await mergeDefaultConfig(config)
        expect(merged).toEqual(config)
    })
})
