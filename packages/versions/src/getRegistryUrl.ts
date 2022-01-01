import type { MonodeployConfiguration, YarnContext } from '@monodeploy/types'
import { Workspace } from '@yarnpkg/core'
import * as pluginNPM from '@yarnpkg/plugin-npm'

export const getFetchRegistryUrl = async ({
    config,
    context,
    workspace,
}: {
    config: MonodeployConfiguration
    context: YarnContext
    workspace: Workspace
}): Promise<string | null> => {
    if (config.noRegistry) {
        return null
    }

    const configRegistryUrl = config.registryUrl
    if (configRegistryUrl) {
        return pluginNPM.npmConfigUtils.normalizeRegistry(configRegistryUrl)
    }

    return await pluginNPM.npmConfigUtils.getScopeRegistry(workspace.manifest.name?.scope ?? null, {
        configuration: context.configuration,
        type: pluginNPM.npmConfigUtils.RegistryType.FETCH_REGISTRY,
    })
}
