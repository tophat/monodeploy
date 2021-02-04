import { Workspace, miscUtils, scriptUtils } from '@yarnpkg/core'
import { PortablePath } from '@yarnpkg/fslib'
import { npmHttpUtils, npmPublishUtils } from '@yarnpkg/plugin-npm'
import { packUtils } from '@yarnpkg/plugin-pack'

import logging from '../logging'
import type {
    MonodeployConfiguration,
    PackageTagMap,
    YarnContext,
} from '../types'
import { assertProductionOrTest } from '../utils/invariants'
import pushTags from '../utils/pushTags'

const maybeExecuteWorkspaceLifecycleScript = async (
    workspace: Workspace,
    scriptName: string,
    { cwd }: { cwd: PortablePath },
): Promise<void> => {
    const topLevelWorkspace = workspace.project.topLevelWorkspace
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
    } else if (topLevelWorkspace.manifest.scripts.has(scriptName)) {
        await scriptUtils.executePackageScript(
            topLevelWorkspace.anchoredLocator,
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

const prepareForPack = async (
    workspace: Workspace,
    { cwd }: { cwd: PortablePath },
    cb: () => Promise<void>,
) => {
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

const prepareForPublish = async (
    workspace: Workspace,
    { cwd }: { cwd: PortablePath },
    cb: () => Promise<void>,
) => {
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

const publishPackages = async (
    config: MonodeployConfiguration,
    context: YarnContext,
    workspacesToPublish: Set<Workspace>,
    registryUrl: string,
    newVersions: PackageTagMap,
): Promise<void> => {
    const prepareWorkspace = async (workspace: Workspace) => {
        const ident = workspace.manifest.name
        if (!ident) return

        const cwd = workspace.cwd
        await prepareForPublish(workspace, { cwd }, async () => {
            await prepareForPack(workspace, { cwd }, async () => {
                const filesToPack = await packUtils.genPackList(workspace)
                const pack = await packUtils.genPackStream(
                    workspace,
                    filesToPack,
                )

                const buffer = await miscUtils.bufferStream(pack)

                const body = await npmPublishUtils.makePublishBody(
                    workspace,
                    buffer,
                    {
                        access: config.access,
                        tag: 'latest',
                        registry: registryUrl,
                    },
                )

                try {
                    const identUrl = npmHttpUtils.getIdentUrl(ident)

                    if (!config.dryRun) {
                        assertProductionOrTest()
                        await npmHttpUtils.put(identUrl, body, {
                            authType: npmHttpUtils.AuthType.ALWAYS_AUTH,
                            configuration: context.project.configuration,
                            ident,
                            registry: registryUrl,
                        })
                    }
                    logging.info(`[Publish] ${ident.name} (${registryUrl})`)
                } catch (e) {
                    logging.error(e)
                }
            })
        })
    }

    await Promise.all([...workspacesToPublish].map(prepareWorkspace))

    // Push git tags
    await pushTags(config, context, newVersions)
}

export default publishPackages
