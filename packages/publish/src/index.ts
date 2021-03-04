import { Workspace, miscUtils } from '@yarnpkg/core'
import { npmHttpUtils, npmPublishUtils } from '@yarnpkg/plugin-npm'
import { packUtils } from '@yarnpkg/plugin-pack'

import { getTopologicalSort } from 'monodeploy-dependencies'
import logging, { assertProductionOrTest } from 'monodeploy-logging'
import type {
    MonodeployConfiguration,
    PackageTagMap,
    YarnContext,
} from 'monodeploy-types'

import getWorkspacesToPublish from './getWorkspacesToPublish'
import { prepareForPack, prepareForPublish } from './prepare'
import pushTags from './pushTags'

export { getWorkspacesToPublish }

export const publishPackages = async (
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
                    logging.info(
                        `[Publish] ${ident.name} (latest: ${body['dist-tags']?.latest}, ${registryUrl})`,
                    )
                } catch (e) {
                    logging.error(e)
                    throw e
                }
            })
        })
    }

    if (config.topologicalSort) {
        const sortedGroups = await getTopologicalSort(workspacesToPublish)
        const promiseChain = sortedGroups.reduce<Promise<void>>(
            (chain, group) =>
                chain.then(
                    async () =>
                        void (await Promise.all(group.map(prepareWorkspace))),
                ),
            Promise.resolve(),
        )
        await promiseChain
    } else {
        await Promise.all([...workspacesToPublish].map(prepareWorkspace))
    }

    // Push git tags
    await pushTags(config, context, newVersions)
}
