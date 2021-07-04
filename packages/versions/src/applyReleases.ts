import { patchPackageJsons } from '@monodeploy/io'
import logging from '@monodeploy/logging'
import type {
    MonodeployConfiguration,
    PackageStrategyMap,
    PackageStrategyType,
    PackageTagMap,
    PackageVersionMap,
    YarnContext,
} from '@monodeploy/types'
import { Workspace } from '@yarnpkg/core'
import * as semver from 'semver'

export const incrementVersion = ({
    currentLatestVersion,
    currentPrereleaseVersion,
    strategy,
    prerelease,
    prereleaseId,
}: {
    currentLatestVersion: string
    currentPrereleaseVersion: string | null
    strategy: PackageStrategyType
    prerelease: boolean
    prereleaseId: string
}): string | null => {
    if (!prerelease) {
        return semver.inc(currentLatestVersion, strategy)
    }

    const semverInfo = currentPrereleaseVersion
        ? semver.parse(currentPrereleaseVersion)
        : null

    if (
        !currentPrereleaseVersion ||
        !semverInfo ||
        // the prerelease version is outdated relative to latest
        semverInfo.compare(currentLatestVersion) <= 0
    ) {
        const releaseType: `pre${PackageStrategyType}` = `pre${strategy}`
        return semver.inc(currentLatestVersion, releaseType, prereleaseId)
    }

    // if bumping to major, but not already on major
    const isPreleaseVersionMajor =
        semverInfo.major > 0 && semverInfo.minor === 0 && semverInfo.patch === 0
    if (strategy === 'major' && !isPreleaseVersionMajor) {
        return semver.inc(currentPrereleaseVersion, 'premajor', prereleaseId)
    }

    // if bumping to minor, but not already on major or patch
    if (strategy === 'minor' && semverInfo.patch !== 0) {
        return semver.inc(currentPrereleaseVersion, 'preminor', prereleaseId)
    }

    return semver.inc(currentPrereleaseVersion, 'prerelease', prereleaseId)
}

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

        const currentLatestVersion = packageTag.latest
        const currentPrereleaseVersion =
            packageTag[config.prereleaseNPMTag] ?? null

        let nextPackageVersion: string | null = currentLatestVersion
        if (packageVersionStrategy) {
            nextPackageVersion = incrementVersion({
                strategy: packageVersionStrategy,
                currentLatestVersion,
                currentPrereleaseVersion,
                prerelease: config.prerelease,
                prereleaseId: config.prereleaseId,
            })
        }

        if (nextPackageVersion && currentLatestVersion !== nextPackageVersion) {
            updatedRegistryTags.set(packageName, nextPackageVersion)
            logging.info(
                `[Version Change] ${packageName}: ${currentLatestVersion} -> ${nextPackageVersion} (${packageVersionStrategy})`,
                { report: context.report },
            )
        } else {
            nonupdatedRegistryTags.set(packageName, currentLatestVersion)
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
