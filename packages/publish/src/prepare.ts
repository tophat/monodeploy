import { maybeExecuteWorkspaceLifecycleScript } from '@monodeploy/io'
import { YarnContext } from '@monodeploy/types'
import { Workspace } from '@yarnpkg/core'
import { PortablePath } from '@yarnpkg/fslib'

export const prepareForPack = async (
    context: YarnContext,
    workspace: Workspace,
    { cwd }: { cwd: PortablePath },
    cb: () => Promise<void>,
): Promise<void> => {
    await maybeExecuteWorkspaceLifecycleScript(context, workspace, 'prepack', {
        cwd,
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
            },
        )
    }
}

export const prepareForPublish = async (
    context: YarnContext,
    workspace: Workspace,
    { cwd }: { cwd: PortablePath },
    cb: () => Promise<void>,
): Promise<void> => {
    await maybeExecuteWorkspaceLifecycleScript(
        context,
        workspace,
        'prepublishOnly',
        {
            cwd,
        },
    )

    await maybeExecuteWorkspaceLifecycleScript(context, workspace, 'prepare', {
        cwd,
    })

    await maybeExecuteWorkspaceLifecycleScript(
        context,
        workspace,
        'prepublish',
        {
            cwd,
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
            },
        )
    }
}
