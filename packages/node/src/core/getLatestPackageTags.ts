import { Workspace } from '@yarnpkg/core'
import * as pluginNPM from '@yarnpkg/plugin-npm'

import logging from 'monodeploy-logging'

import type {
    MonodeployConfiguration,
    PackageTagMap,
    YarnContext,
} from '../types'

const getLatestPackageTags = async (
    config: MonodeployConfiguration,
    context: YarnContext,
): Promise<PackageTagMap> => {
    const workspaces = [
        context.project.topLevelWorkspace.cwd,
        ...context.project.topLevelWorkspace.workspacesCwds,
    ]
        .map(wCwd => context.project.workspacesByCwd.get(wCwd))
        .filter(workspace => !workspace?.manifest.private)

    const distTags = await Promise.all(
        (workspaces as Array<Workspace>).map(async workspace => {
            const ident = workspace.manifest.name
            if (ident) {
                const identUrl = pluginNPM.npmHttpUtils.getIdentUrl(ident)
                const distTagUrl = `/-/package${identUrl}/dist-tags`
                const pkgName = ident.scope
                    ? `@${ident.scope}/${ident.name}`
                    : ident.name

                try {
                    const result = await pluginNPM.npmHttpUtils.get(
                        distTagUrl,
                        {
                            configuration: context.configuration,
                            ident,
                            jsonResponse: true,
                        },
                    )
                    return [pkgName, result.latest]
                } catch (err) {
                    if (String(err).includes('404 (Not Found)')) {
                        // Package has never been published before
                        logging.warning(
                            `[Get Tags] Cannot find ${pkgName} in registry (version: 0.0.0)`,
                        )
                        return [pkgName, '0.0.0']
                    }

                    logging.error(
                        `[Get Tags] Failed to fetch latest tags for ${pkgName}`,
                    )
                    throw err
                }
            }
            return [null, null]
        }),
    )

    const tags: PackageTagMap = new Map()
    for (const [pkgName, latest] of distTags) {
        if (pkgName) tags.set(pkgName, latest)
    }

    return tags
}

export default getLatestPackageTags
