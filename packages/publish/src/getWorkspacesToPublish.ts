import { Workspace, structUtils } from '@yarnpkg/core'

import type { PackageStrategyMap, YarnContext } from '@monodeploy/types'

const getWorkspacesToPublish = async ({
    context,
    versionStrategies,
}: {
    context: YarnContext
    versionStrategies: PackageStrategyMap
}): Promise<Set<Workspace>> => {
    const workspacesByIdent = context.project.workspaces.reduce(
        (workspacesMap: Map<string, Workspace>, current: Workspace) => {
            const manifestName = current.manifest.name

            if (manifestName) {
                const ident = structUtils.stringifyIdent(manifestName)
                workspacesMap.set(ident, current)
            }
            return workspacesMap
        },
        new Map(),
    )

    const workspacesToRelease = new Set<Workspace>()

    for (const packageName of versionStrategies.keys()) {
        const workspace = workspacesByIdent.get(packageName)

        if (workspace && !workspace.manifest.private) {
            workspacesToRelease.add(workspace)
        }
    }

    return workspacesToRelease
}

export default getWorkspacesToPublish
