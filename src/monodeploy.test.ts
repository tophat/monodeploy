import path from 'path'

import * as mockNPM from '@yarnpkg/plugin-npm'

import { LOG_LEVELS } from './logging'
import monodeploy from './monodeploy'
import type { MonodeployConfiguration } from './types'
import * as mockGit from './utils/git'

jest.mock('@yarnpkg/plugin-npm')
jest.mock('./utils/git')

describe('Monodeploy Dry Run', () => {
    const monodeployConfig: MonodeployConfiguration = {
        cwd: path.resolve(process.cwd(), 'example-monorepo'),
        dryRun: true,
        git: {
            baseBranch: 'master',
            commitSha: 'HEAD',
            remote: 'origin',
        },
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
        mockGit._commitFiles_('feat: some new feature!', [
            './packages/pkg-1/README.md',
        ])

        const result = await monodeploy(monodeployConfig)

        // pkg-1 is explicitly updated with minor bump
        expect(result['pkg-1'].version).toEqual('0.1.0')

        // pkg-2 is not in modified dependency graph
        expect(result['pkg-2'].version).toEqual('0.0.1')

        // pkg-3 is not in modified dependency graph
        expect(result['pkg-3'].version).toEqual('0.0.1')
    })

    it('propagates dependant changes', async () => {
        mockNPM._setTag_('pkg-1', '0.0.1')
        mockNPM._setTag_('pkg-2', '0.0.1')
        mockNPM._setTag_('pkg-3', '0.0.1')
        mockGit._commitFiles_(
            'feat: some new feature!\n\nBREAKING CHANGE: major bump!',
            ['./packages/pkg-2/README.md'],
        )

        const result = await monodeploy(monodeployConfig)

        // pkg-1 is not in modified dependency graph
        expect(result['pkg-1'].version).toEqual('0.0.1')

        // pkg-2 is the one explicitly updated with breaking change
        expect(result['pkg-2'].version).toEqual('1.0.0')

        // pkg-3 depends on pkg-2, and is updated as dependent
        expect(result['pkg-3'].version).toEqual('0.0.2')
    })

    it('defaults to 0.0.0 as base version for first publish', async () => {
        mockGit._commitFiles_('feat: some new feature!', [
            './packages/pkg-1/README.md',
        ])

        const result = await monodeploy(monodeployConfig)

        // pkg-1 is explicitly updated with minor bump
        expect(result['pkg-1'].version).toEqual('0.1.0')

        // pkg-2 is not in modified dependency graph
        expect(result['pkg-2'].version).toEqual('0.0.0')

        // pkg-3 is not in modified dependency graph
        expect(result['pkg-3'].version).toEqual('0.0.0')
    })
})
