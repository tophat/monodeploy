/* eslint jest/expect-expect: ["error", { "assertFunctionNames": ["expect", "expectOrdering"] }] */

import { createMonorepoContext } from '@monodeploy/test-utils'
import { type YarnContext } from '@monodeploy/types'
import { type Workspace, structUtils } from '@yarnpkg/core'

import getTopologicalSort from './getTopologicalSort'

const identToWorkspace = (context: YarnContext, name: string): Workspace =>
    context.project.getWorkspaceByIdent(structUtils.parseIdent(name))

function mapToName(value: Workspace[][] | Workspace[]) {
    return value.map((group) => {
        if (Array.isArray(group)) {
            return group.map((w) => structUtils.stringifyIdent(w.manifest.name!))
        }
        return structUtils.stringifyIdent(group.manifest.name!)
    })
}

function expectOrdering(received: Workspace[][]) {
    return {
        toEqual(actual: Workspace[][]) {
            expect(mapToName(received)).toEqual(mapToName(actual))
        },
        not: {
            toEqual(actual: Workspace[][]) {
                expect(mapToName(received)).not.toEqual(mapToName(actual))
            },
        },
    }
}

describe('Topological Sort', () => {
    it('returns a single item for a single package monorepo', async () => {
        await using context = await createMonorepoContext({
            'pkg-1': {},
        })
        const workspace1 = identToWorkspace(context, 'pkg-1')
        const sorted = await getTopologicalSort([workspace1])

        expectOrdering(sorted).toEqual([[workspace1]])
    })

    it('groups packages with no dependencies or dependents', async () => {
        await using context = await createMonorepoContext({
            'pkg-1': {},
            'pkg-2': {},
            'pkg-3': {},
        })
        const workspace1 = identToWorkspace(context, 'pkg-1')
        const workspace2 = identToWorkspace(context, 'pkg-2')
        const workspace3 = identToWorkspace(context, 'pkg-3')

        expectOrdering(await getTopologicalSort([workspace1])).toEqual([[workspace1]])
        expect(mapToName(await getTopologicalSort([workspace1, workspace2, workspace3]))).toEqual([
            expect.arrayContaining(mapToName([workspace1, workspace2, workspace3])),
        ])
    })

    it('places dependencies before dependents', async () => {
        await using context = await createMonorepoContext({
            'pkg-1': { dependencies: ['pkg-3'] },
            'pkg-2': { dependencies: ['pkg-1'] },
            'pkg-3': {},
        })
        const workspace1 = identToWorkspace(context, 'pkg-1')
        const workspace2 = identToWorkspace(context, 'pkg-2')
        const workspace3 = identToWorkspace(context, 'pkg-3')

        const sorted = await getTopologicalSort([workspace1, workspace2, workspace3])
        expectOrdering(sorted).toEqual([[workspace3], [workspace1], [workspace2]])
    })

    it('correctly groups packages with dependents using `workspace:` protocol', async () => {
        await using context = await createMonorepoContext({
            'pkg-1': {
                version: '1.0.0',
                dependencies: [['pkg-2', 'workspace:^2.0.0']],
            },
            'pkg-2': {
                version: '2.0.0',
            },
        })
        const workspace1 = identToWorkspace(context, 'pkg-1')
        const workspace2 = identToWorkspace(context, 'pkg-2')

        const sorted = await getTopologicalSort([workspace1, workspace2])
        expectOrdering(sorted).toEqual([[workspace2], [workspace1]])
    })

    it('detects a cycle', async () => {
        await using context = await createMonorepoContext({
            'pkg-1': { dependencies: ['pkg-3'] },
            'pkg-2': { dependencies: ['pkg-1'] },
            'pkg-3': { dependencies: ['pkg-2'] },
        })
        const workspace1 = identToWorkspace(context, 'pkg-1')
        const workspace2 = identToWorkspace(context, 'pkg-2')
        const workspace3 = identToWorkspace(context, 'pkg-3')

        expectOrdering(await getTopologicalSort([workspace1, workspace3])).toEqual([
            [workspace3],
            [workspace1],
        ])

        await expect(async () =>
            getTopologicalSort([workspace1, workspace2, workspace3]),
        ).rejects.toThrow('cycle')
    })

    it('does not consider dev dependencies', async () => {
        await using context = await createMonorepoContext({
            'pkg-1': { devDependencies: ['pkg-3'] },
            'pkg-2': { devDependencies: ['pkg-1'] },
            'pkg-3': { devDependencies: ['pkg-2'] },
        })
        const workspace1 = identToWorkspace(context, 'pkg-1')
        const workspace2 = identToWorkspace(context, 'pkg-2')
        const workspace3 = identToWorkspace(context, 'pkg-3')

        expectOrdering(await getTopologicalSort([workspace1, workspace2, workspace3])).toEqual([
            [workspace1, workspace2, workspace3],
        ])
    })

    it('handles complex graphs', async () => {
        await using context = await createMonorepoContext({
            'pkg-1': {
                dependencies: ['pkg-2', 'pkg-4'],
            },
            'pkg-2': {
                dependencies: ['pkg-3', 'pkg-4'],
            },
            'pkg-3': { dependencies: ['pkg-4'] },
            'pkg-4': {},
        })
        const workspaces = ['pkg-1', 'pkg-2', 'pkg-3', 'pkg-4'].map((k) =>
            identToWorkspace(context, k),
        )

        expectOrdering(await getTopologicalSort([...workspaces], { dev: true })).toEqual([
            [workspaces[3] /* pkg-4 */],
            [workspaces[2] /* pkg-3 */],
            [workspaces[1] /* pkg-2 */],
            [workspaces[0] /* pkg-1 */],
        ])
    })

    it('handles complex graphs 2', async () => {
        await using context = await createMonorepoContext({
            'pkg-1': {
                devDependencies: ['pkg-9'],
                dependencies: ['pkg-2', 'pkg-4', 'pkg-3', 'pkg-6', 'pkg-5'],
            },
            'pkg-2': {},
            'pkg-3': { devDependencies: ['pkg-9'], dependencies: ['pkg-8'] },
            'pkg-4': { dependencies: ['pkg-2', 'pkg-3', 'pkg-5'] },
            'pkg-5': { devDependencies: ['pkg-9'], dependencies: ['pkg-8'] },
            'pkg-6': {
                devDependencies: ['pkg-9'],
                dependencies: ['pkg-8', 'pkg-10'],
            },
            'pkg-7': { devDependencies: ['pkg-9'], dependencies: ['pkg-8'] },
            'pkg-8': { devDependencies: ['pkg-9'] },
            'pkg-9': {},
            'pkg-10': { devDependencies: ['pkg-9'], dependencies: ['pkg-8'] },
            'pkg-11': { devDependencies: ['pkg-9'], dependencies: ['pkg-10'] },
            'pkg-12': {
                devDependencies: ['pkg-9'],
                dependencies: ['pkg-4', 'pkg-8'],
            },
            'pkg-13': {},
            'pkg-14': { devDependencies: ['pkg-9'], dependencies: ['pkg-10'] },
            'pkg-15': { dependencies: ['pkg-16'] },
            'pkg-16': { devDependencies: ['pkg-9'] },
        })
        const workspaces = [
            'pkg-1',
            'pkg-2',
            'pkg-3',
            'pkg-4',
            'pkg-5',
            'pkg-6',
            'pkg-7',
            'pkg-8',
            'pkg-9',
            'pkg-10',
            'pkg-11',
            'pkg-12',
            'pkg-13',
            'pkg-14',
            'pkg-15',
            'pkg-16',
        ].map((k) => identToWorkspace(context, k))

        expectOrdering(await getTopologicalSort([...workspaces], { dev: true })).toEqual([
            [workspaces[8]],
            [workspaces[7]],
            [workspaces[1], workspaces[2], workspaces[4], workspaces[9]],
            [workspaces[3], workspaces[5], workspaces[15]],
            [
                workspaces[0],
                workspaces[6],
                workspaces[10],
                workspaces[11],
                workspaces[12],
                workspaces[13],
                workspaces[14],
            ],
        ])
    })
})

describe('Topological Sort, with Dev Dependencies', () => {
    it('places dependencies before dependents', async () => {
        await using context = await createMonorepoContext({
            'pkg-1': { devDependencies: ['pkg-3'] },
            'pkg-2': { devDependencies: ['pkg-1'] },
            'pkg-3': {},
        })
        const workspace1 = identToWorkspace(context, 'pkg-1')
        const workspace2 = identToWorkspace(context, 'pkg-2')
        const workspace3 = identToWorkspace(context, 'pkg-3')

        expectOrdering(await getTopologicalSort([workspace1, workspace2, workspace3])).not.toEqual([
            [workspace3],
            [workspace1],
            [workspace2],
        ])

        expectOrdering(
            await getTopologicalSort([workspace1, workspace2, workspace3], { dev: true }),
        ).toEqual([[workspace3], [workspace1], [workspace2]])
    })

    it('traverses both dependencies and dev dependencies', async () => {
        await using context = await createMonorepoContext({
            'pkg-1': { devDependencies: ['pkg-3'] },
            'pkg-2': { dependencies: ['pkg-1'] },
            'pkg-3': {},
        })
        const workspace1 = identToWorkspace(context, 'pkg-1')
        const workspace2 = identToWorkspace(context, 'pkg-2')
        const workspace3 = identToWorkspace(context, 'pkg-3')

        expectOrdering(
            await getTopologicalSort([workspace1, workspace2, workspace3], { dev: true }),
        ).toEqual([[workspace3], [workspace1], [workspace2]])
    })
})
