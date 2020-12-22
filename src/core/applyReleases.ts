import { inc as incrementSemver } from 'semver'

import logging from '../logging'
import patchPackageJsons from './patchPackageJsons'
import type {
    MonodeployConfiguration,
    PackageStrategyMap,
    PackageTagMap,
    YarnContext,
} from '../types'

const applyReleases = async (
    config: MonodeployConfiguration,
    context: YarnContext,
    registryTags: PackageTagMap,
    versionStrategies: PackageStrategyMap,
): Promise<void> => {
    // Registry tags from mono
    const intendedRegistryTags = new Map()

    for (const [packageName, packageTag] of registryTags.entries()) {
        const packageVersionStrategy = versionStrategies.get(packageName)
        const nextPackageTag = packageVersionStrategy
            ? incrementSemver(packageTag, packageVersionStrategy)
            : packageTag
        intendedRegistryTags.set(packageName, nextPackageTag)

        if (packageTag !== nextPackageTag)
            logging.info(
                `${packageName} version change: ${packageTag} -> ${nextPackageTag}`,
            )
    }

    // Update newVersions to contain appropriate updates for dependents
    if (config.dryRun) return

    await patchPackageJsons(config, context, intendedRegistryTags)
}

export default applyReleases
