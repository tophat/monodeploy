import { Manifest, Workspace, structUtils } from '@yarnpkg/core'

import type {
    MonodeployConfiguration,
    PackageStrategyMap,
    YarnContext,
} from '../types'

function* getDependencies(context: YarnContext, workspace: Workspace) {
    for (const dependencySetKey of Manifest.allDependencies) {
        for (const descriptor of workspace.manifest[
            dependencySetKey
        ].values()) {
            const workspace = context.project.tryWorkspaceByDescriptor(
                descriptor,
            )
            if (workspace === null) continue
            yield workspace
        }
    }
}

const getImplicitVersionStrategies = async (
    config: MonodeployConfiguration,
    context: YarnContext,
    intentionalStrategies: PackageStrategyMap,
): Promise<PackageStrategyMap> => {
    // Every workspace needs any sort of update
    const workspaceToDependents = new Map<Workspace, Set<Workspace>>()

    for (const dependent of context.project.workspaces) {
        for (const dependency of getDependencies(context, dependent)) {
            const dependents =
                workspaceToDependents.get(dependency) ?? new Set<Workspace>()
            dependents.add(dependent)
            workspaceToDependents.set(dependency, dependents)
        }
    }

    const requiresUpdate = new Map()
    const pending = [...workspaceToDependents.keys()]

    while (pending.length) {
        const dependency = pending.shift()
        if (!dependency) continue
        const dependents = workspaceToDependents.get(dependency)
        if (!dependents || !dependents.size) continue

        // If the dependency does not have an intentional update,
        // we can ignore the dependents
        const dependencyIdent = dependency.manifest.name
        if (!dependencyIdent) throw new Error('Missing dependency identity.')
        const dependencyName = structUtils.stringifyIdent(dependencyIdent)
        if (!intentionalStrategies.has(dependencyName)) continue

        for (const dependent of dependents) {
            const ident = dependent?.manifest?.name
            if (!ident) throw new Error('Missing workspace identity.')
            if (dependent?.manifest?.private) continue
            const name = structUtils.stringifyIdent(ident)
            if (requiresUpdate.has(name)) continue
            if (intentionalStrategies.has(name)) continue
            pending.push(dependent)
            requiresUpdate.set(name, { type: 'patch', commits: [] })
        }
    }

    return requiresUpdate
}

export default getImplicitVersionStrategies
