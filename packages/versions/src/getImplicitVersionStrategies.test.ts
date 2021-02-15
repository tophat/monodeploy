import { join, resolve } from 'path'

import { getPluginConfiguration } from '@yarnpkg/cli'
import { Configuration, Project } from '@yarnpkg/core'

import { YarnContext } from 'monodeploy-types'

import { getImplicitVersionStrategies } from '.'

const cwd = resolve('./example-monorepo')

async function setupContext(cwd: string): Promise<YarnContext> {
    const configuration = await Configuration.find(
        cwd,
        getPluginConfiguration(),
    )
    const { project, workspace } = await Project.find(configuration, cwd)

    const context: YarnContext = {
        configuration,
        project,
        workspace,
    }

    return context
}

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
