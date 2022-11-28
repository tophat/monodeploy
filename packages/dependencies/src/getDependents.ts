import type { MonodeployConfiguration, YarnContext } from '@monodeploy/types'
import { type Workspace, structUtils } from '@yarnpkg/core'

const getDependents = async (
    config: MonodeployConfiguration,
    context: YarnContext,
    packageNames: Set<string>,
): Promise<Set<string>> => {
    const identToWorkspace = new Map<string, Workspace>()
    const topLevelWorkspace = context.project.topLevelWorkspace

    // Enable easy lookup of workspace name to workspace
    for (const workspace of context.project.workspaces) {
        const isTopLevel = structUtils.areDescriptorsEqual(
            workspace.anchoredDescriptor,
            topLevelWorkspace.anchoredDescriptor,
        )
        if (isTopLevel || !workspace.manifest.name) continue
        const ident = structUtils.stringifyIdent(workspace.manifest.name)
        identToWorkspace.set(ident, workspace)
    }

    // Enable O(1) lookup of Workspace -> Direct Dependents
    const identToDirectDependents = new Map<string, Set<string>>()
    for (const ident of identToWorkspace.keys()) {
        const workspace = identToWorkspace.get(ident)
        if (!workspace) continue
        for (const key of ['dependencies', 'peerDependencies']) {
            const dependencies = workspace.manifest.getForScope(key)
            for (const dependency of dependencies.values()) {
                const dependencyIdent = structUtils.stringifyIdent(dependency)

                // Prune invalid workspace candidates (e.g. top level)
                if (!identToWorkspace.has(dependencyIdent)) continue

                const dependents = identToDirectDependents.get(dependencyIdent) ?? new Set<string>()
                dependents.add(ident)
                identToDirectDependents.set(dependencyIdent, dependents)
            }
        }
    }

    const allDependents = new Set<string>()

    const queue = [...packageNames]
    while (queue.length) {
        const pkgName = queue.shift()
        if (!pkgName) continue

        if (allDependents.has(pkgName)) {
            // Already visited.
            continue
        }

        allDependents.add(pkgName)

        const pkgDependents = identToDirectDependents.get(pkgName)
        if (pkgDependents?.size) {
            for (const pkgDependent of pkgDependents) {
                queue.unshift(pkgDependent)
            }
        }
    }

    // Cleanup: Remove starting nodes as expected by the consumers of getDependents
    for (const pkgName of packageNames) {
        allDependents.delete(pkgName)
    }

    return allDependents
}

export default getDependents
