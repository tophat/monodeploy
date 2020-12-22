import { Workspace, miscUtils } from '@yarnpkg/core'
import { packUtils } from '@yarnpkg/plugin-pack'
import { npmHttpUtils, npmPublishUtils } from '@yarnpkg/plugin-npm'
import logging from '../logging'
import type {
    MonodeployConfiguration,
    YarnContext,
    PackageStrategyMap,
} from '../types'

const publishPackages = async (
    config: MonodeployConfiguration,
    context: YarnContext,
    versionStrategies: PackageStrategyMap,
    workspacesToPublish: Set<Workspace>,
): Promise<void> => {
    for (const workspace of workspacesToPublish) {
        if (config.dryRun) {
            logging.info('Skipping publish step because of dry-run.')
            break
        }

        // Prepare pack streams.
        const filesToPack = await packUtils.genPackList(workspace)
        const pack = await packUtils.genPackStream(workspace, filesToPack)

        // Publish
        const buffer = await miscUtils.bufferStream(pack)

        const body = await npmPublishUtils.makePublishBody(workspace, buffer, {
            access: 'token', // TODO: replace with token.
            tag: 'tag-tag', // TODO: replace with actual tag.
            registry: config.registryUrl,
        })

        // TODO: Tidy this up.
        try {
            const ident = workspace.manifest.name

            if (!ident) continue
            await npmHttpUtils.put(npmHttpUtils.getIdentUrl(ident), body, {
                authType: npmHttpUtils.AuthType.NO_AUTH,
                configuration: context.project.configuration,
                ident,
                registry: config.registryUrl,
            })
        } catch (e) {
            console.error(e)
        }
    }

    // Push git tags
    // TODO
}

export default publishPackages
