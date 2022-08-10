import { maybeExecuteWorkspaceLifecycleScript } from '@monodeploy/io'
import type { MonodeployConfiguration, YarnContext } from '@monodeploy/types'
import { Workspace } from '@yarnpkg/core'
import pLimit from 'p-limit'

export function createWorkspaceLifecycleExecutor({
    limit,
    config,
    groups,
    context,
}: {
    limit: pLimit.Limit
    config: MonodeployConfiguration
    context: YarnContext
    groups: Workspace[][]
}) {
    async function executeInGroups(
        callback: (workspace: Workspace) => Promise<void>,
    ): Promise<void> {
        await groups.reduce<Promise<void>>(
            (chain, group) =>
                chain.then(async () => {
                    await Promise.all(group.map((workspace) => limit(() => callback(workspace))))
                }),
            Promise.resolve(),
        )
    }

    async function executeLifecycle(script: string | ((workspace: Workspace) => Promise<void>)) {
        await executeInGroups((workspace) => {
            if (typeof script === 'function') {
                return script(workspace)
            }
            return maybeExecuteWorkspaceLifecycleScript(context, workspace, script, {
                cwd: workspace.cwd,
                dryRun: config.dryRun,
            })
        })
    }

    return executeLifecycle
}
