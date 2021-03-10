import { Workspace, scriptUtils, structUtils } from '@yarnpkg/core'
import { PortablePath } from '@yarnpkg/fslib'

import logging from '@monodeploy/logging'
import { YarnContext } from '@monodeploy/types'

export const maybeExecuteWorkspaceLifecycleScript = async (
    context: YarnContext,
    workspace: Workspace,
    scriptName: string,
    { cwd }: { cwd: PortablePath },
): Promise<void> => {
    if (!workspace.manifest.scripts.has(scriptName)) return

    const opts: Parameters<typeof scriptUtils.executePackageScript>[3] = {
        cwd,
        project: workspace.project,
        stdin: null,
        stdout: process.stdout,
        stderr: process.stderr,
    }

    const exec = async () => {
        await scriptUtils.executePackageScript(
            workspace.anchoredLocator,
            scriptName,
            [],
            opts,
        )
    }

    const pkgName = structUtils.stringifyIdent(workspace.manifest.name!)
    const prefix = `[${pkgName}]`

    const [stdout, endStdout] = logging.createReportStream({
        prefix,
        report: context.report,
    })

    opts.stdout = stdout
    opts.stderr = stdout

    try {
        await exec()
    } finally {
        stdout.end()
        await endStdout
    }
}
