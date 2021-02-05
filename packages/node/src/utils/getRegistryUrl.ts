import * as pluginNPM from '@yarnpkg/plugin-npm'

import type { MonodeployConfiguration, YarnContext } from 'monodeploy-types'

const getRegistryUrl = async (
    config: MonodeployConfiguration,
    context: YarnContext,
): Promise<string> => {
    if (config.registryUrl) return config.registryUrl
    return await pluginNPM.npmConfigUtils.getPublishRegistry(
        context.workspace.manifest,
        { configuration: context.configuration },
    )
}

export default getRegistryUrl
