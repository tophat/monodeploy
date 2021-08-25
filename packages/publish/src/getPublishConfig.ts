import type { MonodeployConfiguration, YarnContext } from '@monodeploy/types'
import { Workspace } from '@yarnpkg/core'
import * as pluginNPM from '@yarnpkg/plugin-npm'

export const getPublishRegistryUrl = async ({
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

    return await pluginNPM.npmConfigUtils.getPublishRegistry(workspace.manifest, {
        configuration: context.configuration,
    })
}
