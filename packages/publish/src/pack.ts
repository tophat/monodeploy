import logging, { assertProductionOrTest } from '@monodeploy/logging'
import type { MonodeployConfiguration, YarnContext } from '@monodeploy/types'
import { type Workspace, miscUtils, structUtils } from '@yarnpkg/core'
import { npmHttpUtils, npmPublishUtils } from '@yarnpkg/plugin-npm'
import { packUtils } from '@yarnpkg/plugin-pack'
import type pLimit from 'p-limit'

import { getPublishRegistryUrl } from './getPublishConfig'

export const pack = async ({
    workspace,
    limitPublish,
    config,
    context,
    publishTag,
    publishCommitSha,
}: {
    workspace: Workspace
    limitPublish: pLimit.Limit
    publishTag: string
    config: MonodeployConfiguration
    context: YarnContext
    publishCommitSha: string | undefined
}) => {
    const ident = workspace.manifest.name
    if (!ident) return

    const pkgName = structUtils.stringifyIdent(ident)
    const registryUrl = await getPublishRegistryUrl({
        config,
        context,
        workspace,
    })

    if (!registryUrl) {
        logging.info(
            `[Publish] '${pkgName}' (${publishTag}: ${workspace.manifest.version}, skipping registry)`,
            { report: context.report },
        )
        return
    }

    const globalAccess = config.access
    const access = globalAccess === 'infer' ? undefined : globalAccess

    logging.info(
        `[Publish] ${pkgName} (${publishTag}: ${workspace.manifest.version}, ${registryUrl}; ${access})`,
        { report: context.report },
    )

    const filesToPack = await packUtils.genPackList(workspace)
    const pack = await packUtils.genPackStream(workspace, filesToPack)
    const buffer = await miscUtils.bufferStream(pack)
    const body = await npmPublishUtils.makePublishBody(workspace, buffer, {
        access,
        tag: publishTag,
        registry: registryUrl,
        gitHead: publishCommitSha,
    })

    const identUrl = npmHttpUtils.getIdentUrl(ident)

    try {
        if (!config.dryRun) {
            assertProductionOrTest()
            await limitPublish(() =>
                npmHttpUtils.put(identUrl, body, {
                    authType: npmHttpUtils.AuthType.ALWAYS_AUTH,
                    configuration: context.project.configuration,
                    ident,
                    registry: registryUrl,
                }),
            )
        }
        logging.info(`[Publish] '${pkgName}' published.`, { report: context.report })
    } catch (err) {
        logging.error(err, {
            report: context.report,
            extras: `[Publish] Failed to publish '${pkgName}' to ${identUrl} (${publishTag}: ${body['dist-tags']?.[publishTag]}, ${registryUrl}; ${body.access})`,
        })
        throw err
    }
}
