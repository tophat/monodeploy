import { MessageName, ReportError, Workspace, structUtils } from '@yarnpkg/core'
import * as pluginNPM from '@yarnpkg/plugin-npm'

import logging from '@monodeploy/logging'
import type {
    MonodeployConfiguration,
    PackageTagMap,
    YarnContext,
} from '@monodeploy/types'

const getLatestPackageTags = async (
    config: MonodeployConfiguration,
    context: YarnContext,
): Promise<PackageTagMap> => {
    const workspaces = [
        context.project.topLevelWorkspace.cwd,
        ...context.project.topLevelWorkspace.workspacesCwds,
    ]
        .map(wCwd => context.project.workspacesByCwd.get(wCwd))
        .filter(
            workspace =>
                !workspace?.manifest.private && workspace?.manifest.name,
        )

    const fetchDistTag = async (workspace: Workspace) => {
        const ident = workspace.manifest.name!
        const pkgName = structUtils.stringifyIdent(ident)
        const manifestVersion = workspace.manifest.version ?? '0.0.0'

        if (config.noRegistry) return [pkgName, manifestVersion]

        const identUrl = pluginNPM.npmHttpUtils.getIdentUrl(ident)
        const distTagUrl = `/-/package${identUrl}/dist-tags`

        try {
            const result = await pluginNPM.npmHttpUtils.get(distTagUrl, {
                configuration: context.configuration,
                ident,
                registry: config.registryUrl,
                jsonResponse: true,
            })
            return [pkgName, result.latest]
        } catch (err) {
            if (
                (err instanceof ReportError &&
                    err.reportCode === MessageName.AUTHENTICATION_INVALID) ||
                err.response?.statusCode === 404
            ) {
                // Assume package has never been published before.
                // If the issue was actually an auth issue, we'll find out
                // later when we attempt to publish.
                logging.warning(
                    `[Get Tags] Cannot find ${pkgName} in registry (version: ${manifestVersion})`,
                    { report: context.report },
                )
                return [pkgName, manifestVersion]
            }

            logging.error(
                `[Get Tags] Failed to fetch latest tags for ${pkgName}`,
                { report: context.report },
            )
            throw err
        }
    }

    const distTags = await Promise.all(
        (workspaces as Array<Workspace>).map(fetchDistTag),
    )

    const tags: PackageTagMap = new Map()
    for (const [pkgName, latest] of distTags) {
        if (pkgName) tags.set(pkgName, latest)
    }

    return tags
}

export default getLatestPackageTags
