import type { MonodeployConfiguration, YarnContext } from '@monodeploy/types'
import * as pluginNPM from '@yarnpkg/plugin-npm'

export const getFetchRegistryUrl = async ({
    config,
    context,
}: {
    config: MonodeployConfiguration
    context: YarnContext
}): Promise<string | null> => {
    if (config.noRegistry) {
        return null
    }

    const configRegistryUrl = config.registryUrl
    if (configRegistryUrl) {
        return pluginNPM.npmConfigUtils.normalizeRegistry(configRegistryUrl)
    }

    return await pluginNPM.npmConfigUtils.getDefaultRegistry({
        configuration: context.configuration,
        type: pluginNPM.npmConfigUtils.RegistryType.FETCH_REGISTRY,
    })
}
