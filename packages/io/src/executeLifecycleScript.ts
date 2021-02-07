import { Workspace, scriptUtils } from '@yarnpkg/core'
import { PortablePath } from '@yarnpkg/fslib'

export const maybeExecuteWorkspaceLifecycleScript = async (
    workspace: Workspace,
    scriptName: string,
    { cwd }: { cwd: PortablePath },
): Promise<void> => {
    if (workspace.manifest.scripts.has(scriptName)) {
        await scriptUtils.executePackageScript(
            workspace.anchoredLocator,
            scriptName,
            [],
            {
                cwd,
                project: workspace.project,
                stdin: null,
                stdout: process.stdout,
                stderr: process.stderr,
            },
        )
    }
}
