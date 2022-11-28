import logging from '@monodeploy/logging'
import { type YarnContext } from '@monodeploy/types'
import { type Workspace, scriptUtils, structUtils } from '@yarnpkg/core'
import { type PortablePath } from '@yarnpkg/fslib'

export const maybeExecuteWorkspaceLifecycleScript = async (
    context: YarnContext,
    workspace: Workspace,
    scriptName: string,
    { cwd, dryRun }: { cwd: PortablePath; dryRun: boolean },
): Promise<void> => {
    if (!workspace.manifest.scripts.has(scriptName)) return

    const opts: Parameters<typeof scriptUtils.executePackageScript>[3] = {
        cwd,
        project: workspace.project,
        stdin: null,
        stdout: process.stdout,
        stderr: process.stderr,
    }

    const pkgName = structUtils.stringifyIdent(workspace.manifest.name!)
    const prefix = `[${pkgName}]`

    const exec = async () => {
        if (dryRun) {
            logging.debug(`${prefix} [Exec] '${scriptName}'`, {
                report: context.report,
            })
            return
        }

        await scriptUtils.executePackageScript(workspace.anchoredLocator, scriptName, [], opts)
    }

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
