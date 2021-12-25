import logging from '@monodeploy/logging'
import {
    MonodeployConfiguration,
    PackageStrategyMap,
    PackageStrategyType,
    YarnContext,
} from '@monodeploy/types'
import { Workspace, structUtils } from '@yarnpkg/core'

import { maxStrategy } from './versionStrategy'

function getIn(raw: Record<string, any>, key: string): unknown | undefined {
    const value = key.split('.').reduce((obj, part) => obj?.[part], raw)
    return value ?? undefined
}

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
}): Promise<{
    versionStrategies: PackageStrategyMap
    workspaceGroups: Map<string, Set<string>>
}> => {
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

            const groupKey = getIn(workspace.manifest.raw, groupField)
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

    for (const group of groups.values()) {
        // we use the highest strategy among the group. This ensures the final version
        // conforms to the format specified by the most meaningful commit. E.g. 4.0.0 indicates
        // a breaking change, while 4.1.1 is guaranteed to be a patch (or at a min, a commit
        // that the end user does not need to worry about).
        const strategy = Array.from(group).reduce(
            (curr, name) => maxStrategy(curr, strategies.get(name)?.type),
            undefined as PackageStrategyType | undefined,
        )

        if (!strategy) continue

        for (const workspaceIdent of group) {
            strategies.set(workspaceIdent, {
                ...strategies.get(workspaceIdent)!,
                type: strategy,
            })
        }
    }

    return { versionStrategies: strategies, workspaceGroups: groups }
}

export default mergeVersionStrategies
