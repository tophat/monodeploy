import { Workspace, structUtils } from '@yarnpkg/core'

import { withMonorepoContext } from '@monodeploy/test-utils/setupMonorepo'
import { YarnContext } from 'monodeploy-types'

import getTopologicalSort from './getTopologicalSort'

const identToWorkspace = (context: YarnContext, name: string): Workspace =>
    context.project.getWorkspaceByIdent(structUtils.parseIdent(name))

describe('Topological Sort', () => {
    it('returns a single item for a single package monorepo', async () =>
        withMonorepoContext(
            {
                'pkg-1': {},
            },
            async context => {
                const workspace1 = identToWorkspace(context, 'pkg-1')
                const sorted = await getTopologicalSort([workspace1])

                expect(sorted).toEqual([[workspace1]])
            },
        ))

    it('groups packages with no dependencies or dependents', async () =>
        withMonorepoContext(
            {
                'pkg-1': {},
                'pkg-2': {},
                'pkg-3': {},
            },
            async context => {
                const workspace1 = identToWorkspace(context, 'pkg-1')
                const workspace2 = identToWorkspace(context, 'pkg-2')
                const workspace3 = identToWorkspace(context, 'pkg-3')

                expect(await getTopologicalSort([workspace1])).toEqual([
                    [workspace1],
                ])
                expect(
                    await getTopologicalSort([
                        workspace1,
                        workspace2,
                        workspace3,
                    ]),
                ).toEqual([
                    expect.arrayContaining([
                        workspace1,
                        workspace2,
                        workspace3,
                    ]),
                ])
            },
        ))

    it('places dependencies before dependents', async () =>
        withMonorepoContext(
            {
                'pkg-1': { dependencies: ['pkg-3'] },
                'pkg-2': { dependencies: ['pkg-1'] },
                'pkg-3': {},
            },
            async context => {
                const workspace1 = identToWorkspace(context, 'pkg-1')
                const workspace2 = identToWorkspace(context, 'pkg-2')
                const workspace3 = identToWorkspace(context, 'pkg-3')

                const sorted = await getTopologicalSort([
                    workspace1,
                    workspace2,
                    workspace3,
                ])
                expect(sorted).toEqual([
                    [workspace3],
                    [workspace1],
                    [workspace2],
                ])
            },
        ))

    it('detects a cycle', async () =>
        withMonorepoContext(
            {
                'pkg-1': { dependencies: ['pkg-3'] },
                'pkg-2': { dependencies: ['pkg-1'] },
                'pkg-3': { dependencies: ['pkg-2'] },
            },
            async context => {
                const workspace1 = identToWorkspace(context, 'pkg-1')
                const workspace2 = identToWorkspace(context, 'pkg-2')
                const workspace3 = identToWorkspace(context, 'pkg-3')

                expect(
                    await getTopologicalSort([workspace1, workspace3]),
                ).toEqual([[workspace3], [workspace1]])

                await expect(async () =>
                    getTopologicalSort([workspace1, workspace2, workspace3]),
                ).rejects.toThrow('cycle')
            },
        ))
})
