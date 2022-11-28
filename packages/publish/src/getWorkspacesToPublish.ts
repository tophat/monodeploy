import type { ChangesetSchema, YarnContext } from '@monodeploy/types'
import { type Workspace, structUtils } from '@yarnpkg/core'

const getWorkspacesToPublish = async ({
    context,
    changeset,
}: {
    context: YarnContext
    changeset: ChangesetSchema
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

    for (const packageName of Object.keys(changeset)) {
        const workspace = workspacesByIdent.get(packageName)

        if (workspace && !workspace.manifest.private) {
            workspacesToRelease.add(workspace)
        }
    }

    return workspacesToRelease
}

export default getWorkspacesToPublish
