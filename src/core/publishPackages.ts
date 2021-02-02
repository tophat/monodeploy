import { Workspace, miscUtils } from '@yarnpkg/core'
import { npmHttpUtils, npmPublishUtils } from '@yarnpkg/plugin-npm'
import { packUtils } from '@yarnpkg/plugin-pack'

import logging from '../logging'
import type {
    MonodeployConfiguration,
    PackageStrategyMap,
    PackageTagMap,
    YarnContext,
} from '../types'
import { assertProductionOrTest } from '../utils/invariants'
import maybeExecuteLifecycleScript from '../utils/maybeExecuteLifecycleScript'
import pushTags from '../utils/pushTags'

const publishPackages = async (
    config: MonodeployConfiguration,
    context: YarnContext,
    versionStrategies: PackageStrategyMap,
    workspacesToPublish: Set<Workspace>,
    registryUrl: string,
    newVersions: PackageTagMap,
): Promise<void> => {
    await Promise.all(
        [...workspacesToPublish].map(async (workspace: Workspace) => {
            // Prepare pack streams.
            await maybeExecuteLifecycleScript(
                context.workspace,
                'prepare',
                workspace,
            )

            await maybeExecuteLifecycleScript(
                context.workspace,
                'prepack',
                workspace,
            )
            const filesToPack = await packUtils.genPackList(workspace)
            const pack = await packUtils.genPackStream(workspace, filesToPack)

            await maybeExecuteLifecycleScript(
                context.workspace,
                'postpack',
                workspace,
            )

            // Publish
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
                const ident = workspace.manifest.name
                if (!ident) return

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
        }),
    )

    // Push git tags
    await pushTags(config, context, newVersions)
}

export default publishPackages
