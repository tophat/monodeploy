import { Manifest, Workspace, structUtils } from '@yarnpkg/core'

import type { MonodeployConfiguration, YarnContext } from 'monodeploy-types'

function* getDependencies(context: YarnContext, workspace: Workspace) {
    for (const dependencySetKey of Manifest.allDependencies) {
        const dependencies = workspace.manifest.getForScope(dependencySetKey)
        if (!dependencies) continue

        for (const descriptor of dependencies.values()) {
            const workspace = context.project.tryWorkspaceByDescriptor(
                descriptor,
            )
            if (workspace === null) continue
            yield workspace
        }
    }
}

const getDependents = async (
    config: MonodeployConfiguration,
    context: YarnContext,
    packageNames: Set<string>,
): Promise<Set<string>> => {
    // Every workspace needs any sort of update
    const workspaceToDependents = new Map<Workspace, Set<Workspace>>()

    for (const dependent of context.project.workspaces) {
        for (const dependency of getDependencies(context, dependent)) {
            if (!workspaceToDependents.has(dependency)) {
                workspaceToDependents.set(dependency, new Set<Workspace>())
            }

            const dependents = workspaceToDependents.get(
                dependency,
            ) as Set<Workspace>
            dependents.add(dependent)
        }
    }

    const discoveredDependents = new Set<string>()
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
        if (!packageNames.has(dependencyName)) continue

        for (const dependent of dependents) {
            const ident = dependent?.manifest?.name
            if (!ident) throw new Error('Missing workspace identity.')
            if (dependent?.manifest?.private) continue
            const name = structUtils.stringifyIdent(ident) as string
            if (discoveredDependents.has(name)) continue
            if (packageNames.has(name)) continue
            pending.push(dependent)
            discoveredDependents.add(name)
        }
    }

    return discoveredDependents
}

export default getDependents
