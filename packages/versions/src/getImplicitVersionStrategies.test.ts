import { join, resolve } from 'path'

import { setupContext } from './test_utils'

import { getImplicitVersionStrategies } from '.'

const cwd = resolve('./example-monorepo')

const defaultMonodeployConfig = {
    cwd,
}

describe('getImplicitVersionStrategies', () => {
    it('produces implicit strategies for the dependents of intentional updates', async () => {
        const cwd = resolve(join(process.cwd(), './example-monorepo'))
        const context = await setupContext(cwd)
        const mockIntentionalUpdates = new Map()
        // Dependency: pkg-3 -> pkg-2
        mockIntentionalUpdates.set('pkg-2', { type: 'major', commits: [] })
        const strategies = await getImplicitVersionStrategies(
            defaultMonodeployConfig,
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
