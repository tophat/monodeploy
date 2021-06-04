import { patchPackageJsons } from '@monodeploy/io'
import logging from '@monodeploy/logging'
import type {
    MonodeployConfiguration,
    PackageStrategyMap,
    PackageTagMap,
    YarnContext,
} from '@monodeploy/types'
import { Workspace } from '@yarnpkg/core'
import { inc as incrementSemver } from 'semver'

const applyReleases = async ({
    config,
    context,
    workspaces,
    registryTags,
    versionStrategies,
}: {
    config: MonodeployConfiguration
    context: YarnContext
    workspaces: Set<Workspace>
    registryTags: PackageTagMap
    versionStrategies: PackageStrategyMap
}): Promise<PackageTagMap> => {
    // Registry tags from mono
    const intendedRegistryTags = new Map()

    for (const [packageName, packageTag] of registryTags.entries()) {
        const packageVersionStrategy = versionStrategies.get(packageName)?.type
        const nextPackageTag = packageVersionStrategy
            ? incrementSemver(packageTag, packageVersionStrategy)
            : packageTag

        if (packageTag !== nextPackageTag) {
            intendedRegistryTags.set(packageName, nextPackageTag)
            logging.info(
                `[Version Change] ${packageName}: ${packageTag} -> ${nextPackageTag} (${packageVersionStrategy})`,
                { report: context.report },
            )
        }
    }

    // Update newVersions to contain appropriate updates for dependents
    await patchPackageJsons(
        config,
        context,
        workspaces,
        new Map([
            ...registryTags.entries(),
            ...intendedRegistryTags.entries(),
        ]) as PackageTagMap,
    )

    return intendedRegistryTags
}

export default applyReleases
