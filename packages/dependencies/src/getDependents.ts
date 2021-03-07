import { Descriptor, Workspace, structUtils } from '@yarnpkg/core'

import logging from 'monodeploy-logging'
import type { MonodeployConfiguration, YarnContext } from 'monodeploy-types'

function* getDependencies(context: YarnContext, workspace: Workspace) {
    for (const dependencySetKey of ['dependencies', 'peerDependencies']) {
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
    // first populate with direct dependents
    const workspaceToDependents = new Map<Descriptor, Set<Descriptor>>()
    for (const workspace of context.project.workspaces) {
        const workspaceDescriptor = workspace.anchoredDescriptor

        for (const dependency of getDependencies(context, workspace)) {
            const dependentsSet =
                workspaceToDependents.get(dependency.anchoredDescriptor) ??
                new Set<Descriptor>()
            dependentsSet.add(workspaceDescriptor)
            workspaceToDependents.set(
                dependency.anchoredDescriptor,
                dependentsSet,
            )
        }
    }

    // We can propagate dependent relations via a transitive property:
    // Given:
    //  pkg-1: [pkg-2, pkg-3]
    //  pkg-2: [pkg-4]
    //  pkg-3: []
    //  pkg-4: []
    // Output:
    //  pkg-1: [pk-2, pkg-3, pk-4]
    //  pkg-n: [pkg-a, ...(dependents of pkg-a)]

    const pending = [...workspaceToDependents.keys()]
    while (pending.length) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const descriptor = pending.shift()!

        const dependentsSet = workspaceToDependents.get(descriptor)
        if (!dependentsSet) continue

        const transitiveDependents = [...dependentsSet]
            .map(dependent => [...(workspaceToDependents.get(dependent) ?? [])])
            .flat()
        for (const transitiveDependent of transitiveDependents) {
            if (!transitiveDependent) continue
            if (
                structUtils.areDescriptorsEqual(descriptor, transitiveDependent)
            ) {
                logging.error('Cycle detected between workspaces.')
                continue
            }
            if (!dependentsSet.has(transitiveDependent)) {
                pending.push(transitiveDependent)
                dependentsSet.add(transitiveDependent)
            }
        }
    }

    const discoveredDependents = new Set<string>()

    for (const pkgName of packageNames.values()) {
        const pkgIdent = structUtils.parseIdent(pkgName)
        const workspace = context.project.tryWorkspaceByIdent(pkgIdent)
        if (!workspace) continue

        for (const dependentDescriptor of workspaceToDependents
            .get(workspace.anchoredDescriptor)
            ?.values() ?? []) {
            const dependentWorkspace = context.project.tryWorkspaceByDescriptor(
                dependentDescriptor,
            )

            if (!dependentWorkspace || dependentWorkspace.manifest.private) {
                continue
            }

            if (!dependentWorkspace.manifest.name) {
                throw new Error('Missing workspace identity.')
            }

            const dependentName = structUtils.stringifyIdent(
                dependentWorkspace.manifest.name,
            )
            if (packageNames.has(dependentName)) continue

            discoveredDependents.add(dependentName)
        }
    }

    return discoveredDependents
}

export default getDependents
