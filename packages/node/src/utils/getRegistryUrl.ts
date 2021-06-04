import type { MonodeployConfiguration, YarnContext } from '@monodeploy/types'
import * as pluginNPM from '@yarnpkg/plugin-npm'

const getRegistryUrl = async ({
    config,
    context,
}: {
    config: MonodeployConfiguration
    context: YarnContext
}): Promise<string> => {
    if (config.registryUrl) return config.registryUrl
    return await pluginNPM.npmConfigUtils.getPublishRegistry(
        context.workspace.manifest,
        { configuration: context.configuration },
    )
}

export default getRegistryUrl
