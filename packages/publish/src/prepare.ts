import { Workspace } from '@yarnpkg/core'
import { PortablePath } from '@yarnpkg/fslib'

import { maybeExecuteWorkspaceLifecycleScript } from 'monodeploy-io'

export const prepareForPack = async (
    workspace: Workspace,
    { cwd }: { cwd: PortablePath },
    cb: () => Promise<void>,
): Promise<void> => {
    await maybeExecuteWorkspaceLifecycleScript(workspace, 'prepack', {
        cwd,
    })
    try {
        await cb()
    } finally {
        await maybeExecuteWorkspaceLifecycleScript(workspace, 'postpack', {
            cwd,
        })
    }
}

export const prepareForPublish = async (
    workspace: Workspace,
    { cwd }: { cwd: PortablePath },
    cb: () => Promise<void>,
): Promise<void> => {
    await maybeExecuteWorkspaceLifecycleScript(workspace, 'prepublishOnly', {
        cwd,
    })

    await maybeExecuteWorkspaceLifecycleScript(workspace, 'prepare', {
        cwd,
    })

    await maybeExecuteWorkspaceLifecycleScript(workspace, 'prepublish', {
        cwd,
    })

    try {
        await cb()
    } finally {
        await maybeExecuteWorkspaceLifecycleScript(workspace, 'postpublish', {
            cwd,
        })
    }
}
