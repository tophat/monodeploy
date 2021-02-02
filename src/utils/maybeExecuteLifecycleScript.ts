import { Workspace, structUtils } from '@yarnpkg/core'
import { execute } from '@yarnpkg/shell'

import logger from '../logging'

export default async function maybeExecuteLifecycleScript(
    workspace: Workspace,
    scriptIdentifier: string,
    targetWorkspace: Workspace,
): Promise<void> {
    const manifest = workspace.manifest
    const ident = targetWorkspace?.manifest?.name

    if (!ident) throw new Error('Missing workspace identity.')
    const scriptContent = manifest.scripts.get(scriptIdentifier)

    if (!scriptContent) return
    const packageName = structUtils.stringifyIdent(ident)
    logger.info(`[Exec] Executing ${scriptIdentifier} script on ${packageName}`)
    const returnCode = await execute(scriptContent, [targetWorkspace.cwd])

    if (returnCode !== 0)
        throw new Error(`${scriptIdentifier} failed on ${packageName}`)
}
