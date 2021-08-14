import { withMonorepoContext } from '@monodeploy/test-utils'
import { YarnContext } from '@monodeploy/types'
import { Workspace, structUtils } from '@yarnpkg/core'

import getTopologicalSort from './getTopologicalSort'

const identToWorkspace = (context: YarnContext, name: string): Workspace =>
    context.project.getWorkspaceByIdent(structUtils.parseIdent(name))

describe('Topological Sort', () => {
    it('returns a single item for a single package monorepo', async () =>
        withMonorepoContext(
            {
                'pkg-1': {},
            },
            async (context) => {
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
            async (context) => {
                const workspace1 = identToWorkspace(context, 'pkg-1')
                const workspace2 = identToWorkspace(context, 'pkg-2')
                const workspace3 = identToWorkspace(context, 'pkg-3')

                expect(await getTopologicalSort([workspace1])).toEqual([[workspace1]])
                expect(await getTopologicalSort([workspace1, workspace2, workspace3])).toEqual([
                    expect.arrayContaining([workspace1, workspace2, workspace3]),
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
            async (context) => {
                const workspace1 = identToWorkspace(context, 'pkg-1')
                const workspace2 = identToWorkspace(context, 'pkg-2')
                const workspace3 = identToWorkspace(context, 'pkg-3')

                const sorted = await getTopologicalSort([workspace1, workspace2, workspace3])
                expect(sorted).toEqual([[workspace3], [workspace1], [workspace2]])
            },
        ))

    it('correctly groups packages with dependents using `workspace:` protocol', async () =>
        withMonorepoContext(
            {
                'pkg-1': {
                    version: '1.0.0',
                    dependencies: [['pkg-2', 'workspace:^2.0.0']],
                },
                'pkg-2': {
                    version: '2.0.0',
                },
            },
            async (context) => {
                const workspace1 = identToWorkspace(context, 'pkg-1')
                const workspace2 = identToWorkspace(context, 'pkg-2')

                const sorted = await getTopologicalSort([workspace1, workspace2])
                expect(sorted).toEqual([[workspace2], [workspace1]])
            },
        ))

    it('detects a cycle', async () =>
        withMonorepoContext(
            {
                'pkg-1': { dependencies: ['pkg-3'] },
                'pkg-2': { dependencies: ['pkg-1'] },
                'pkg-3': { dependencies: ['pkg-2'] },
            },
            async (context) => {
                const workspace1 = identToWorkspace(context, 'pkg-1')
                const workspace2 = identToWorkspace(context, 'pkg-2')
                const workspace3 = identToWorkspace(context, 'pkg-3')

                expect(await getTopologicalSort([workspace1, workspace3])).toEqual([
                    [workspace3],
                    [workspace1],
                ])

                await expect(async () =>
                    getTopologicalSort([workspace1, workspace2, workspace3]),
                ).rejects.toThrow('cycle')
            },
        ))

    it('does not consider dev dependencies', async () =>
        withMonorepoContext(
            {
                'pkg-1': { devDependencies: ['pkg-3'] },
                'pkg-2': { devDependencies: ['pkg-1'] },
                'pkg-3': { devDependencies: ['pkg-2'] },
            },
            async (context) => {
                const workspace1 = identToWorkspace(context, 'pkg-1')
                const workspace2 = identToWorkspace(context, 'pkg-2')
                const workspace3 = identToWorkspace(context, 'pkg-3')

                expect(await getTopologicalSort([workspace1, workspace2, workspace3])).toEqual([
                    [workspace1, workspace2, workspace3],
                ])
            },
        ))
})

describe('Topological Sort, with Dev Dependencies', () => {
    it('places dependencies before dependents', async () =>
        withMonorepoContext(
            {
                'pkg-1': { devDependencies: ['pkg-3'] },
                'pkg-2': { devDependencies: ['pkg-1'] },
                'pkg-3': {},
            },
            async (context) => {
                const workspace1 = identToWorkspace(context, 'pkg-1')
                const workspace2 = identToWorkspace(context, 'pkg-2')
                const workspace3 = identToWorkspace(context, 'pkg-3')

                expect(await getTopologicalSort([workspace1, workspace2, workspace3])).not.toEqual([
                    [workspace3],
                    [workspace1],
                    [workspace2],
                ])

                expect(
                    await getTopologicalSort([workspace1, workspace2, workspace3], { dev: true }),
                ).toEqual([[workspace3], [workspace1], [workspace2]])
            },
        ))

    it('traverses both dependencies and dev dependencies', async () =>
        withMonorepoContext(
            {
                'pkg-1': { devDependencies: ['pkg-3'] },
                'pkg-2': { dependencies: ['pkg-1'] },
                'pkg-3': {},
            },
            async (context) => {
                const workspace1 = identToWorkspace(context, 'pkg-1')
                const workspace2 = identToWorkspace(context, 'pkg-2')
                const workspace3 = identToWorkspace(context, 'pkg-3')

                expect(
                    await getTopologicalSort([workspace1, workspace2, workspace3], { dev: true }),
                ).toEqual([[workspace3], [workspace1], [workspace2]])
            },
        ))
})
