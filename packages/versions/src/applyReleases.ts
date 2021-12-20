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

const maxVersion = (a: string | null, b: string | null): string | null => {
    if (!a) return b
    if (!b) return a

    const semverInfo = semver.parse(a)
    if (!semverInfo || semverInfo?.compare(b) <= 0) {
        return b
    }
    return a
}

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
}): { previous: string; next: string | null } => {
    if (!prerelease) {
        return {
            previous: currentLatestVersion,
            next: semver.inc(currentLatestVersion, strategy),
        }
    }

    const semverInfo = currentPrereleaseVersion ? semver.parse(currentPrereleaseVersion) : null

    if (
        !currentPrereleaseVersion ||
        !semverInfo ||
        // the prerelease version is outdated relative to latest
        semverInfo.compare(currentLatestVersion) <= 0
    ) {
        const releaseType: `pre${PackageStrategyType}` = `pre${strategy}`
        return {
            previous: currentLatestVersion,
            next: semver.inc(currentLatestVersion, releaseType, prereleaseId),
        }
    }

    // if bumping to major, but not already on major
    const isPreleaseVersionMajor =
        semverInfo.major > 0 && semverInfo.minor === 0 && semverInfo.patch === 0
    if (strategy === 'major' && !isPreleaseVersionMajor) {
        return {
            previous: currentPrereleaseVersion,
            next: semver.inc(currentPrereleaseVersion, 'premajor', prereleaseId),
        }
    }

    // if bumping to minor, but not already on major or patch
    if (strategy === 'minor' && semverInfo.patch !== 0) {
        return {
            previous: currentPrereleaseVersion,
            next: semver.inc(currentPrereleaseVersion, 'preminor', prereleaseId),
        }
    }

    return {
        previous: currentPrereleaseVersion,
        next: semver.inc(currentPrereleaseVersion, 'prerelease', prereleaseId),
    }
}

type VersionChange = { previous: string; next: string }

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
}): Promise<{ previous: PackageVersionMap; next: PackageVersionMap }> => {
    const updatedRegistryTags = new Map<string, VersionChange>()
    const nonupdatedRegistryTags = new Map<string, VersionChange>()

    for (const [packageName, packageTag] of registryTags.entries()) {
        const packageVersionStrategy = versionStrategies.get(packageName)?.type

        const currentLatestVersion = packageTag.latest
        const currentPrereleaseVersion = packageTag[config.prereleaseNPMTag] ?? null

        const { previous, next } = packageVersionStrategy
            ? incrementVersion({
                  strategy: packageVersionStrategy,
                  currentLatestVersion,
                  currentPrereleaseVersion,
                  prerelease: config.prerelease,
                  prereleaseId: config.prereleaseId,
              })
            : { previous: null, next: null }

        if (!next || !previous || previous === next) {
            const version = config.prerelease
                ? maxVersion(currentLatestVersion, currentPrereleaseVersion) ?? currentLatestVersion
                : currentLatestVersion
            nonupdatedRegistryTags.set(packageName, {
                previous: version,
                next: version,
            })
            continue
        }

        updatedRegistryTags.set(packageName, { previous, next })
    }

    // first populate the groups by group key
    const groups = new Map<string, Set<string>>()
    for (const packageName of updatedRegistryTags.keys()) {
        const groupKey = versionStrategies.get(packageName)?.group ?? packageName
        const group = groups.get(groupKey) ?? new Set()
        groups.set(groupKey, group)
        group.add(packageName)
    }

    const fullyIndependent = groups.size === updatedRegistryTags.size

    // merge group updates
    for (const [groupKey, group] of groups.entries()) {
        const version: string | null = Array.from(group).reduce(
            (curr, packageName) =>
                maxVersion(curr, updatedRegistryTags.get(packageName)?.next ?? null),
            null as string | null,
        )
        if (!version) continue

        for (const packageName of group) {
            updatedRegistryTags.set(packageName, {
                ...updatedRegistryTags.get(packageName)!,
                next: version,
            })
            const update = updatedRegistryTags.get(packageName)!

            if (fullyIndependent) {
                logging.info(
                    `[Version Change] ${packageName}: ${update.previous} -> ${update.next} (${
                        versionStrategies.get(packageName)?.type
                    })`,
                    { report: context.report },
                )
            } else {
                logging.info(
                    `[Version Change] ${packageName}: ${update.previous} -> ${update.next} (${
                        versionStrategies.get(packageName)?.type
                    }, group: ${groupKey})`,
                    { report: context.report },
                )
            }
        }
    }

    const patchVersions: PackageVersionMap = new Map()
    for (const [pkg, info] of [
        ...nonupdatedRegistryTags.entries(),
        ...updatedRegistryTags.entries(),
    ]) {
        patchVersions.set(pkg, info.next)
    }

    await patchPackageJsons(config, context, workspaces, patchVersions)

    const next: PackageVersionMap = new Map()
    const previous: PackageVersionMap = new Map()
    for (const [pkg, info] of updatedRegistryTags.entries()) {
        next.set(pkg, info.next)
        previous.set(pkg, info.previous)
    }

    return { next, previous }
}

export default applyReleases
