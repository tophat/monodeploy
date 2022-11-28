import { createRequire } from 'module'

import logging from '@monodeploy/logging'
import { getDynamicLibs } from '@yarnpkg/cli'
import packageJson from '@yarnpkg/cli/package.json'
import { type PluginConfiguration } from '@yarnpkg/core'

const requireForCLI = createRequire(require.resolve('@yarnpkg/cli'))

/**
 * We cannot use getPluginConfiguration since it's possible some plugins are
 * incompatible with the version of yarnpkg/core we use in monodeploy.
 */
export const getCompatiblePluginConfiguration = (): PluginConfiguration => {
    const plugins = new Set<string>()
    for (const dependencyName of packageJson['@yarnpkg/builder'].bundles.standard) {
        plugins.add(dependencyName)
    }

    const modules = getDynamicLibs()
    let incompatibility = false
    for (const plugin of plugins) {
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            modules.set(plugin, requireForCLI(plugin).default)
        } catch {
            incompatibility = true
            logging.warning(`[Configuration] Unable to configure '${plugin}', skipping.`, {
                report: null,
            })
        }
    }
    if (incompatibility) {
        logging.warning(
            '[Configuration] Some plugins could not be configured. This is likely due to ' +
                'an incompatibility with the Yarn version you are using in your project and ' +
                'the Yarn API versions used in Monodeploy. See: https://github.com/tophat/monodeploy/issues/302',
            { report: null },
        )
    }

    return { plugins, modules }
}
