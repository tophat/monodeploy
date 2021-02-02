import { Workspace, structUtils } from '@yarnpkg/core'
import { PortablePath } from '@yarnpkg/fslib'
import { execute } from '@yarnpkg/shell'

import logger from '../logging'

export default async function maybeExecuteLifecycleScript(
    workspace: Workspace,
    scriptIdentifier: string,
    cwd: PortablePath,
): Promise<void> {
    const manifest = workspace.manifest
    const ident = workspace?.manifest?.name

    if (!ident) throw new Error('Missing workspace identity.')
    const scriptContent = manifest.scripts.get(scriptIdentifier)
    if (scriptContent) {
        const packageName = structUtils.stringifyIdent(ident)
        logger.info(
            `[Exec] Executing ${scriptIdentifier} script on ${packageName}`,
        )
        const returnCode = await execute(scriptContent, [cwd])
    }
}
