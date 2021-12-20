import logging from '@monodeploy/logging'
import { MonodeployConfiguration, PackageStrategyMap, YarnContext } from '@monodeploy/types'
import { Workspace, structUtils } from '@yarnpkg/core'

const mergeVersionStrategies = async ({
    config,
    context,
    intentionalStrategies,
    implicitVersionStrategies,
}: {
    config: MonodeployConfiguration
    context: YarnContext
    intentionalStrategies: PackageStrategyMap
    implicitVersionStrategies: PackageStrategyMap
}): Promise<PackageStrategyMap> => {
    const groupField = config.packageGroupManifestField ?? 'name'

    const strategies: PackageStrategyMap = new Map([
        ...intentionalStrategies.entries(),
        ...implicitVersionStrategies.entries(),
    ])

    const workspaces = new Map<string, Workspace>()
    const groups = new Map<string, Set<string>>()
    for (const workspace of context.project.workspaces) {
        if (workspace.manifest.private || !workspace.manifest.name) continue
        const ident = structUtils.stringifyIdent(workspace.manifest.name)
        if (strategies.has(ident)) {
            workspaces.set(ident, workspace)

            const groupKey = workspace.manifest.raw[groupField]
            if (typeof groupKey !== 'string') {
                logging.warning(
                    `[Versions] Invalid group key resolved in '${ident}' using field '${groupField}'.`,
                    { report: context.report },
                )
                continue
            }

            const group = groups.get(groupKey) ?? new Set()
            group.add(ident)
            groups.set(groupKey, group)
        }
    }

    for (const [groupKey, group] of groups.entries()) {
        for (const workspaceIdent of group) {
            strategies.set(workspaceIdent, {
                ...strategies.get(workspaceIdent)!,
                group: groupKey,
            })
        }
    }

    return strategies
}

export default mergeVersionStrategies
