import { promises as fs } from 'fs'

import { getMonodeployConfig } from '@monodeploy/test-utils'
import setupMonorepo from '@monodeploy/test-utils/setupMonorepo'

import { getImplicitVersionStrategies } from '.'

describe('getImplicitVersionStrategies', () => {
    let context

    beforeEach(async () => {
        context = await setupMonorepo({
            'pkg-1': {},
            'pkg-2': {},
            'pkg-3': { dependencies: ['pkg-2'] },
            'pkg-4': {},
            'pkg-5': { private: true, dependencies: ['pkg-4'] },
            'pkg-6': {
                dependencies: ['pkg-3', 'pkg-7'],
            },
            'pkg-7': {},
        })
    })

    afterEach(async () => {
        try {
            await fs.rm(context.project.cwd, { recursive: true, force: true })
        } catch {}
    })

    it('produces implicit strategies for the dependents of intentional updates', async () => {
        const mockIntentionalUpdates = new Map()
        // Dependency: pkg-3 -> pkg-2
        mockIntentionalUpdates.set('pkg-2', { type: 'major', commits: [] })
        const strategies = await getImplicitVersionStrategies(
            await getMonodeployConfig({
                cwd: context.project.cwd,
                baseBranch: 'master',
                commitSha: 'shashasha',
            }),
            context,
            mockIntentionalUpdates,
        )

        expect(strategies).toEqual(
            new Map(
                Object.entries({ 'pkg-3': { type: 'patch', commits: [] } }),
            ),
        )
    })
})
