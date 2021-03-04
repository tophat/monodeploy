import { Workspace } from '@yarnpkg/core'

type Level = number

/**
 * Takes an iterable of workspaces and returns a topologically list:
 * [ [A, B], [C, D], [E] ]
 */
const getTopologicalSort = async (
    workspaces: Iterable<Workspace>,
): Promise<Array<Array<Workspace>>> => {
    const ordered = new Map<Workspace, Level>()
    for (const workspace of workspaces) {
        const level = Math.max(ordered.get(workspace) ?? 0, 0)
        ordered.set(workspace, level)

        const dependencyDescriptors = [
            ...workspace.manifest.dependencies.values(),
            ...workspace.manifest.devDependencies.values(),
        ]
        for (const descriptor of dependencyDescriptors) {
            const child = workspace.project.tryWorkspaceByDescriptor(descriptor)
            if (child) {
                ordered.set(
                    child,
                    Math.max(ordered.get(child) ?? level + 1, level + 1),
                )
            }
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
        .sort((a, b) => Number(a[0]) - Number(b[0]))
        .map(([, workspaceGroup]) => workspaceGroup)
}

export default getTopologicalSort
