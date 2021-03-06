import logging from '@monodeploy/logging'
import type {
    MonodeployConfiguration,
    PackageTagMap,
    YarnContext,
} from '@monodeploy/types'
import { MessageName, ReportError, Workspace, structUtils } from '@yarnpkg/core'
import * as pluginNPM from '@yarnpkg/plugin-npm'
import pLimit from 'p-limit'

const getLatestPackageTags = async ({
    config,
    context,
    registryUrl,
}: {
    config: MonodeployConfiguration
    context: YarnContext
    registryUrl?: string | null
}): Promise<PackageTagMap> => {
    const limitFetch = pLimit(config.maxConcurrentReads || 10)

    const workspaces = [
        context.project.topLevelWorkspace.cwd,
        ...context.project.topLevelWorkspace.workspacesCwds,
    ]
        .map((wCwd) => context.project.workspacesByCwd.get(wCwd))
        .filter(
            (workspace) =>
                !workspace?.manifest.private && workspace?.manifest.name,
        )

    const fetchDistTag = async (
        workspace: Workspace,
    ): Promise<[string, Record<string, string> & { latest: string }]> => {
        const ident = workspace.manifest.name!
        const pkgName = structUtils.stringifyIdent(ident)
        const manifestVersion = workspace.manifest.version ?? '0.0.0'

        if (config.noRegistry || !registryUrl) {
            return [pkgName, { latest: manifestVersion }]
        }

        const identUrl = pluginNPM.npmHttpUtils.getIdentUrl(ident)
        const distTagUrl = `/-/package${identUrl}/dist-tags`

        try {
            const result = await limitFetch(() =>
                pluginNPM.npmHttpUtils.get(distTagUrl, {
                    configuration: context.configuration,
                    ident,
                    registry: registryUrl,
                    jsonResponse: true,
                }),
            )

            return [pkgName, { latest: manifestVersion, ...result }]
        } catch (err) {
            const statusCode =
                err.response?.statusCode ??
                err.originalError?.response?.statusCode

            if (
                (err instanceof ReportError &&
                    err.reportCode === MessageName.AUTHENTICATION_INVALID) ||
                statusCode === 404
            ) {
                // Assume package has never been published before.
                // If the issue was actually an auth issue, we'll find out
                // later when we attempt to publish.
                logging.warning(
                    `[Get Tags] Cannot find ${pkgName} in registry (version: ${manifestVersion}, ${config.registryUrl})`,
                    { report: context.report },
                )
                return [pkgName, { latest: manifestVersion }]
            }

            if (
                statusCode === 500 &&
                config.registryUrl?.match(/\.jfrog\.io\//)
            ) {
                // There is a bug when using jfrog artifactory's virtual repo such that
                // trying to fetch tags for non-published packages results in a 500 rather
                // than a 404.
                // See: https://www.jfrog.com/jira/browse/RTFACT-16518
                logging.warning(
                    `[Get Tags] [HTTP 500] Cannot find ${pkgName} in registry (version: ${manifestVersion})`,
                    { report: context.report },
                )
                return [pkgName, { latest: manifestVersion }]
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
