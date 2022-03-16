import { cleanUp, setupContext, setupTestRepository } from '@monodeploy/test-utils'
import { PortablePath, npath } from '@yarnpkg/fslib'

import { getWorkspacesToPublish } from '.'

describe('getWorspacesToPublish', () => {
    let workspacePath: PortablePath

    beforeEach(async () => {
        workspacePath = await setupTestRepository()
    })

    afterEach(async () => {
        await cleanUp([npath.fromPortablePath(workspacePath)])
    })

    it("doesn't include private workspaces", async () => {
        const cwd = workspacePath

        const context = await setupContext(cwd)
        // pkg-5 is private. Note the test is a bit misleading since
        // the changeset wouldn't actually have a private package in it.
        // This can theoretically happen if an old changeset is loaded after a package
        // was made private.
        const workspacesToRelease = await getWorkspacesToPublish({
            context,
            changeset: {
                'pkg-5': {
                    version: '1.0.0',
                    changelog: '',
                    group: 'pkg-5',
                    tag: 'pkg-5@1.0.0',
                    previousVersion: '0.0.0',
                    strategy: 'major',
                },
            },
        })

        expect(workspacesToRelease.size).toBe(0)
    })

    it('builds a map of workspaces that have an associated changeset entry', async () => {
        const cwd = workspacePath
        const context = await setupContext(cwd)
        const workspacesToRelease = await getWorkspacesToPublish({
            context,
            changeset: {
                'pkg-6': {
                    version: '1.0.0',
                    changelog: '',
                    group: 'pkg-6',
                    tag: 'pkg-6@1.0.0',
                    previousVersion: '0.0.0',
                    strategy: 'major',
                },
            },
        })

        expect(workspacesToRelease.size).toBe(1)
        expect([...workspacesToRelease][0].manifest.name!.name).toBe('pkg-6')
    })
})
