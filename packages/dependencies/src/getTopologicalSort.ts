import { DescriptorHash, Workspace } from '@yarnpkg/core'

type Level = number

/**
 * Takes an iterable of workspaces and returns a topologically list:
 * [ [A, B], [C, D], [E] ]
 */
const getTopologicalSort = async (
    workspaces: Iterable<Workspace>,
    { dev }: { dev: boolean } = { dev: false },
): Promise<Array<Array<Workspace>>> => {
    const possibleWorkspaces = new Map(
        [...workspaces].map(workspace => [
            workspace.anchoredDescriptor.descriptorHash,
            workspace,
        ]),
    )
    const maxPossibleVisits = possibleWorkspaces.size

    const ordered = new Map<Workspace, Level>()
    const visited = new Map<DescriptorHash, number>()
    const queue = [...possibleWorkspaces.values()]
    while (queue.length) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const workspace = queue.shift()!
        const workspaceHash = workspace.anchoredDescriptor.descriptorHash
        const visitedCount = visited.get(workspaceHash) ?? 0
        visited.set(workspaceHash, visitedCount + 1)

        if (visitedCount > maxPossibleVisits) {
            throw new Error(
                'Unable to determine topological sort. There is likely a cycle.',
            )
        }

        const level = Math.max(ordered.get(workspace) ?? 0, 0)
        ordered.set(workspace, level)

        const dependencies = [
            ...workspace.manifest.dependencies.values(),
            ...(dev ? workspace.manifest.devDependencies.values() : []),
        ]
        for (const descriptor of dependencies) {
            const child = workspace.project.tryWorkspaceByDescriptor(descriptor)
            if (
                !child ||
                !possibleWorkspaces.has(child.anchoredDescriptor.descriptorHash)
            ) {
                continue
            }

            ordered.set(
                child,
                Math.max(ordered.get(child) ?? level + 1, level + 1),
            )
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
