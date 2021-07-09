import { maybeExecuteWorkspaceLifecycleScript } from '@monodeploy/io'
import { YarnContext } from '@monodeploy/types'
import { Workspace } from '@yarnpkg/core'
import { PortablePath } from '@yarnpkg/fslib'

export const prepareForPack = async (
    context: YarnContext,
    workspace: Workspace,
    { cwd, dryRun }: { cwd: PortablePath; dryRun: boolean },
    cb: () => Promise<void>,
): Promise<void> => {
    await maybeExecuteWorkspaceLifecycleScript(context, workspace, 'prepack', {
        cwd,
        dryRun,
    })
    try {
        await cb()
    } finally {
        await maybeExecuteWorkspaceLifecycleScript(
            context,
            workspace,
            'postpack',
            {
                cwd,
                dryRun,
            },
        )
    }
}

export const prepareForPublish = async (
    context: YarnContext,
    workspace: Workspace,
    { cwd, dryRun }: { cwd: PortablePath; dryRun: boolean },
    cb: () => Promise<void>,
): Promise<void> => {
    await maybeExecuteWorkspaceLifecycleScript(
        context,
        workspace,
        'prepublishOnly',
        {
            cwd,
            dryRun,
        },
    )

    await maybeExecuteWorkspaceLifecycleScript(context, workspace, 'prepare', {
        cwd,
        dryRun,
    })

    await maybeExecuteWorkspaceLifecycleScript(
        context,
        workspace,
        'prepublish',
        {
            cwd,
            dryRun,
        },
    )

    try {
        await cb()
    } finally {
        await maybeExecuteWorkspaceLifecycleScript(
            context,
            workspace,
            'postpublish',
            {
                cwd,
                dryRun,
            },
        )
    }
}
