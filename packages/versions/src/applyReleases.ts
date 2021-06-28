import { patchPackageJsons } from '@monodeploy/io'
import logging from '@monodeploy/logging'
import type {
    MonodeployConfiguration,
    PackageStrategyMap,
    PackageTagMap,
    PackageVersionMap,
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
}): Promise<PackageVersionMap> => {
    const updatedRegistryTags = new Map<string, string>()
    const nonupdatedRegistryTags = new Map<string, string>()

    for (const [packageName, packageTag] of registryTags.entries()) {
        const packageVersionStrategy = versionStrategies.get(packageName)?.type
        const nextPackageTag = packageVersionStrategy
            ? incrementSemver(packageTag.latest, packageVersionStrategy)
            : packageTag.latest

        if (nextPackageTag && packageTag.latest !== nextPackageTag) {
            updatedRegistryTags.set(packageName, nextPackageTag)
            logging.info(
                `[Version Change] ${packageName}: ${packageTag.latest} -> ${nextPackageTag} (${packageVersionStrategy})`,
                { report: context.report },
            )
        } else {
            nonupdatedRegistryTags.set(packageName, packageTag.latest)
        }
    }

    await patchPackageJsons(
        config,
        context,
        workspaces,
        new Map([
            ...nonupdatedRegistryTags.entries(),
            ...updatedRegistryTags.entries(),
        ]),
    )

    return updatedRegistryTags
}

export default applyReleases
