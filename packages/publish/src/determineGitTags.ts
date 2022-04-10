import type { PackageVersionMap } from '@monodeploy/types'

async function determineGitTags({
    versions,
    workspaceGroups,
}: {
    versions: PackageVersionMap
    workspaceGroups: Map<string, Set<string>>
}): Promise<Map<string, string>> {
    const groupByPackageName = new Map<string, string>()
    for (const [groupKey, group] of workspaceGroups.entries()) {
        for (const packageName of group) {
            groupByPackageName.set(packageName, groupKey)
        }
    }

    const tags = [...versions.entries()].map((packageVersionEntry: string[]) => {
        const [packageName, packageVersion] = packageVersionEntry
        const name = groupByPackageName.get(packageName) ?? packageName
        const tag = `${name}@${packageVersion}`
        return [packageName, tag]
    })

    const packageTags = new Map<string, string>()
    for (const tag of tags) {
        if (!tag) continue
        packageTags.set(tag[0], tag[1])
    }

    return packageTags
}

export default determineGitTags
