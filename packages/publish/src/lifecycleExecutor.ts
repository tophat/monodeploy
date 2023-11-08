import { maybeExecuteWorkspaceLifecycleScript } from '@monodeploy/io'
import type { MonodeployConfiguration, YarnContext } from '@monodeploy/types'
import { type Workspace } from '@yarnpkg/core'
import type pLimit from 'p-limit'

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
                    // We'll wait for all promises to settle so we don't have runaway 'processes'
                    const results = await Promise.allSettled(
                        group.map((workspace) => limit(() => callback(workspace))),
                    )
                    const rejections = results.filter(
                        (result): result is PromiseRejectedResult => result.status === 'rejected',
                    )
                    if (rejections.length) {
                        // We'll throw the first one for now.
                        // This can be improved in the future.
                        throw rejections[0].reason
                    }
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
