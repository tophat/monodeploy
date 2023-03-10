import logging from '@monodeploy/logging'
import type {
    MonodeployConfiguration,
    PackageStrategyMap,
    PackageStrategyType,
    PackageTagMap,
    PackageVersionMap,
    YarnContext,
} from '@monodeploy/types'
import * as semver from 'semver'

const maxVersion = (a?: string | null, b?: string | null): string | null => {
    if (!a) return b ?? null
    if (!b) return a ?? null

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
}): { fromPrerelease: boolean; previous: string; next: string | null } => {
    if (!prerelease) {
        return {
            previous: currentLatestVersion,
            next: semver.inc(currentLatestVersion, strategy),
            fromPrerelease: false,
        }
    }

    const baseVersion =
        maxVersion(currentPrereleaseVersion, currentLatestVersion) ?? currentLatestVersion
    const semverInfo = semver.parse(baseVersion)

    if (!semverInfo?.prerelease?.length) {
        const releaseType: `pre${PackageStrategyType}` = `pre${strategy}`
        return {
            previous: currentLatestVersion,
            next: semver.inc(currentLatestVersion, releaseType, prereleaseId),
            fromPrerelease: false,
        }
    }

    // if bumping to major, but not already on major
    const isPreleaseVersionMajor =
        semverInfo.major > 0 && semverInfo.minor === 0 && semverInfo.patch === 0
    if (strategy === 'major' && !isPreleaseVersionMajor) {
        return {
            previous: baseVersion,
            next: semver.inc(baseVersion, 'premajor', prereleaseId),
            fromPrerelease: true,
        }
    }

    // if bumping to minor, but not already on major or patch
    if (strategy === 'minor' && semverInfo.patch !== 0) {
        return {
            previous: baseVersion,
            next: semver.inc(baseVersion, 'preminor', prereleaseId),
            fromPrerelease: true,
        }
    }

    return {
        previous: baseVersion,
        next: semver.inc(baseVersion, 'prerelease', prereleaseId),
        fromPrerelease: true,
    }
}

type VersionChange = { previous: string; next: string }

function buildBaseVersionsByGroup({
    workspaceGroups,
    registryTags,
    prereleaseNPMTag,
}: {
    workspaceGroups: Map<string, Set<string>>
    registryTags: PackageTagMap
    prereleaseNPMTag: string
}) {
    const baseVersionsByGroup = new Map<string, { latest: string; prerelease: string | null }>(
        Array.from(workspaceGroups.entries()).map(([groupKey, group]) => [
            groupKey,
            {
                // there's always a latest so we'll default to 0.0.0 so we can keep 'null' out of the types
                latest: Array.from(group).reduce<string>(
                    (curr, packageName) =>
                        maxVersion(curr, registryTags.get(packageName)?.latest) ?? '0.0.0',
                    '0.0.0',
                ),
                prerelease: Array.from(group).reduce<string | null>(
                    (curr, packageName) =>
                        maxVersion(curr, registryTags.get(packageName)?.[prereleaseNPMTag] ?? null),
                    null,
                ),
            },
        ]),
    )
    return baseVersionsByGroup
}

const applyVersionStrategies = async ({
    config,
    context,
    registryTags,
    versionStrategies,
    workspaceGroups,
}: {
    config: MonodeployConfiguration
    context: YarnContext
    registryTags: PackageTagMap
    versionStrategies: PackageStrategyMap
    workspaceGroups: Map<string, Set<string>>
}): Promise<{ previous: PackageVersionMap; next: PackageVersionMap }> => {
    // determine base tags for the groups. To do this, we create a map of
    // group name to max latest and prerelease version among said group
    const baseVersionsByGroup = buildBaseVersionsByGroup({
        workspaceGroups,
        registryTags,
        prereleaseNPMTag: config.prereleaseNPMTag,
    })

    const updatedRegistryTags = new Map<string, VersionChange>()
    const nonupdatedRegistryTags = new Map<string, VersionChange>()

    for (const [groupKey, group] of workspaceGroups.entries()) {
        const baseVersions = baseVersionsByGroup.get(groupKey)
        if (!baseVersions) continue

        for (const packageName of group) {
            const packageTag = registryTags.get(packageName)
            if (!packageTag) continue

            const packageVersionStrategy = versionStrategies.get(packageName)?.type

            const currentLatestVersion = packageTag.latest
            const currentPrereleaseVersion = packageTag[config.prereleaseNPMTag] ?? null

            const { previous, next, fromPrerelease } = packageVersionStrategy
                ? incrementVersion({
                      strategy: packageVersionStrategy,
                      currentLatestVersion: baseVersions.latest,
                      currentPrereleaseVersion: baseVersions.prerelease,
                      prerelease: config.prerelease,
                      prereleaseId: config.prereleaseId,
                  })
                : { previous: null, next: null, fromPrerelease: false }

            if (!next || !previous || previous === next) {
                const version = config.prerelease
                    ? maxVersion(currentLatestVersion, currentPrereleaseVersion) ??
                      currentLatestVersion
                    : currentLatestVersion
                nonupdatedRegistryTags.set(packageName, {
                    previous: version,
                    next: version,
                })
                continue
            }

            updatedRegistryTags.set(packageName, {
                // Although we use the largest version in the group in calculating the next version,
                // we still want to reference the package's registry tag as the previous version.
                // This way, the changeset will correctly include the previous version as the version
                // in npm prior to running monodeploy.
                previous: fromPrerelease
                    ? currentPrereleaseVersion ?? currentLatestVersion
                    : currentLatestVersion,
                next,
            })
        }
    }

    const isFullyIndependent = workspaceGroups.size === updatedRegistryTags.size

    // merge group updates
    for (const [groupKey, group] of workspaceGroups.entries()) {
        const version: string | null = Array.from(group).reduce<string | null>(
            (curr, packageName) =>
                maxVersion(curr, updatedRegistryTags.get(packageName)?.next ?? null),
            null,
        )
        if (!version) continue

        for (const packageName of group) {
            // skip packages with no associated versions (e.g. private packages)
            if (!registryTags.get(packageName)) continue
            // skip packages with no associated version strategy
            if (!versionStrategies.get(packageName)) continue

            updatedRegistryTags.set(packageName, {
                ...updatedRegistryTags.get(packageName)!,
                next: version,
            })
            const update = updatedRegistryTags.get(packageName)!
            if (isFullyIndependent) {
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

    const next: PackageVersionMap = new Map()
    const previous: PackageVersionMap = new Map()

    // non-update "next" is actually what's "current" since it's not changing
    // this means "next" is a subset of the packages in "previous"
    for (const [pkg, info] of nonupdatedRegistryTags.entries()) {
        previous.set(pkg, info.next)
    }

    for (const [pkg, info] of updatedRegistryTags.entries()) {
        next.set(pkg, info.next)
        previous.set(pkg, info.previous)
    }

    return { next, previous }
}

export default applyVersionStrategies
