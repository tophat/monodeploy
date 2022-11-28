import logging from '@monodeploy/logging'
import { type YarnContext } from '@monodeploy/types'
import { type Workspace, structUtils } from '@yarnpkg/core'

function getIn(raw: Record<string, any>, key: string): unknown | undefined {
    const value = key.split('.').reduce((obj, part) => obj?.[part], raw)
    return value ?? undefined
}

export function resolveGroupName({
    context,
    workspace,
    packageGroupManifestField,
}: {
    context: YarnContext
    workspace: Workspace
    packageGroupManifestField?: string | undefined
}): string | null {
    if (!workspace.manifest.name) return null

    const ident = structUtils.stringifyIdent(workspace.manifest.name)

    const groupField = packageGroupManifestField ?? 'name'
    const groupKey = getIn(workspace.manifest.raw, groupField) ?? ident
    if (typeof groupKey !== 'string') {
        logging.warning(
            `[Versions] Invalid group key resolved in '${ident}' using field '${groupField}'.`,
            { report: context.report },
        )
        return null
    }
    return groupKey
}
