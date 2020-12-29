import { Workspace, miscUtils } from '@yarnpkg/core'
import { packUtils } from '@yarnpkg/plugin-pack'
import { npmHttpUtils, npmPublishUtils } from '@yarnpkg/plugin-npm'

import logging from '../logging'
import type {
    MonodeployConfiguration,
    PackageStrategyMap,
    YarnContext,
} from '../types'

const publishPackages = async (
    config: MonodeployConfiguration,
    context: YarnContext,
    versionStrategies: PackageStrategyMap,
    workspacesToPublish: Set<Workspace>,
    registryUrl: string,
): Promise<void> => {
    if (config.dryRun) {
        logging.info('Skipping publish step because of dry-run.')
    }

    await Promise.all(
        [...workspacesToPublish].map(async (workspace: Workspace) => {
            // Prepare pack streams.
            const filesToPack = await packUtils.genPackList(workspace)
            const pack = await packUtils.genPackStream(workspace, filesToPack)

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
                    await npmHttpUtils.put(identUrl, body, {
                        authType: npmHttpUtils.AuthType.ALWAYS_AUTH,
                        configuration: context.project.configuration,
                        ident,
                        registry: registryUrl,
                    })
                }
            } catch (e) {
                logging.error(e)
            }
        }),
    )

    // Push git tags
    // TODO
}

export default publishPackages
