import { cleanUp, setupContext, setupTestRepository } from '@monodeploy/test-utils'
import { PortablePath } from '@yarnpkg/fslib'

import { getWorkspacesToPublish } from '.'

describe('getWorspacesToPublish', () => {
    let workspacePath: string

    beforeEach(async () => {
        workspacePath = await setupTestRepository()
    })

    afterEach(async () => {
        await cleanUp([workspacePath])
    })

    it("doesn't include private workspaces", async () => {
        const cwd = workspacePath

        const context = await setupContext(cwd as PortablePath)
        const versionStrategies = new Map()
        // pkg-5 is private
        versionStrategies.set('pkg-5', { strategy: 'major', commits: [] })
        const workspacesToRelease = await getWorkspacesToPublish({
            context,
            versionStrategies,
        })

        expect(workspacesToRelease.size).toEqual(0)
        //expect([...workspacesToRelease][0].manifest.name.name).toEqual('pkg-6')
    })

    it('builds a map of workspaces that have an associated version strategy', async () => {
        const cwd = workspacePath
        const context = await setupContext(cwd as PortablePath)
        const versionStrategies = new Map()
        versionStrategies.set('pkg-6', { strategy: 'major', commits: [] })
        const workspacesToRelease = await getWorkspacesToPublish({
            context,
            versionStrategies,
        })

        expect(workspacesToRelease.size).toEqual(1)
        expect([...workspacesToRelease][0].manifest.name!.name).toEqual('pkg-6')
    })
})
