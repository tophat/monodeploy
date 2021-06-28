import { PackageTagMap, PackageVersionMap } from '@monodeploy/types'

export const convertTagMapToVersions = (
    tagMap: PackageTagMap,
    { tag }: { tag: 'latest' | string },
): PackageVersionMap => {
    const versionMap: PackageVersionMap = new Map()
    for (const [pkgName, map] of tagMap.entries()) {
        const tagValue = map[tag]
        if (tagValue) {
            versionMap.set(pkgName, tagValue)
        }
    }
    return versionMap
}
