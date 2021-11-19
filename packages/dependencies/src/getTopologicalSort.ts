import { Workspace } from '@yarnpkg/core'

type Level = number

/**
 * Takes an iterable of workspaces and returns a topologically sorted list:
 * [ [A, B], [C, D], [E] ]
 */
const getTopologicalSort = async (
    workspaces: Iterable<Workspace>,
    { dev }: { dev: boolean } = { dev: false },
): Promise<Array<Array<Workspace>>> => {
    const possibleWorkspaces = new Map(
        [...workspaces].map((workspace) => [
            workspace.anchoredDescriptor.descriptorHash,
            workspace,
        ]),
    )

    const ordered = new Map<Workspace, Level>()
    const queue = [...possibleWorkspaces.values()]
    while (queue.length) {
        const workspace = queue.shift()!

        const level = Math.max(ordered.get(workspace) ?? 0, 0)
        ordered.set(workspace, level)

        if (level > possibleWorkspaces.size) {
            throw new Error('Unable to determine topological sort. There is likely a cycle.')
        }

        const dependencies = [
            ...workspace.manifest.dependencies.values(),
            ...(dev ? workspace.manifest.devDependencies.values() : []),
        ]
        for (const descriptor of dependencies) {
            const child = workspace.project.tryWorkspaceByIdent(descriptor)
            if (!child || !possibleWorkspaces.has(child.anchoredDescriptor.descriptorHash)) {
                continue
            }

            ordered.set(child, Math.max(ordered.get(child) ?? level + 1, level + 1))
            queue.unshift(child)
        }
    }

    const grouped = [...ordered.entries()].reduce<{
        [key: number]: Array<Workspace>
    }>((groups, [workspace, level]) => {
        groups[level] = groups[level] ?? []
        groups[level].push(workspace)
        return groups
    }, {})

    return Object.entries(grouped)
        .sort((a, b) => Number(b[0]) - Number(a[0]))
        .map(([, workspaceGroup]) => workspaceGroup)
}

export default getTopologicalSort
