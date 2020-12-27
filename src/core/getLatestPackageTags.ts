import { Workspace } from '@yarnpkg/core'
import * as pluginNPM from '@yarnpkg/plugin-npm'

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
                const result = await pluginNPM.npmHttpUtils.get(distTagUrl, {
                    configuration: context.configuration,
                    ident,
                    jsonResponse: true,
                })
                const pkgName = ident.scope
                    ? `@${ident.scope}/${ident.name}`
                    : ident.name
                return [pkgName, result.latest]
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
