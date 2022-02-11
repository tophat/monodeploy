import type {
    ChangesetSchema,
    MonodeployConfiguration,
    PackageStrategyMap,
    PackageVersionMap,
    YarnContext,
} from '@monodeploy/types'

import generateChangelogEntry from './changelog'

const generateChangeset = async ({
    config,
    context,
    previousTags,
    nextTags,
    versionStrategies,
    gitTags,
    workspaceGroups,
}: {
    config: MonodeployConfiguration
    context: YarnContext
    previousTags: PackageVersionMap
    nextTags: PackageVersionMap
    versionStrategies: PackageStrategyMap
    gitTags?: Map<string, string>
    workspaceGroups: Map<string, Set<string>>
}): Promise<ChangesetSchema> => {
    const changesetData: ChangesetSchema = {}

    for (const [packageName, newVersion] of nextTags.entries()) {
        const previousVersion = previousTags.get(packageName) ?? null
        const versionStrategy = versionStrategies.get(packageName)
        const changelog = await generateChangelogEntry({
            config,
            context,
            packageName,
            previousVersion,
            newVersion,
            commits: versionStrategy?.commits ?? [],
        })
        changesetData[packageName] = {
            version: newVersion,
            previousVersion: previousVersion,
            changelog,
            tag: gitTags?.get(packageName) ?? null,
            strategy: versionStrategy?.type ?? null,
            group: packageName, // overwritten below
        }
    }

    for (const [groupKey, group] of workspaceGroups.entries()) {
        for (const packageName of group) {
            if (!changesetData[packageName]) continue
            changesetData[packageName].group = groupKey ?? packageName
        }
    }

    return changesetData
}

export default generateChangeset
