import type { PackageVersionMap } from '@monodeploy/types'

async function determineGitTags({
    versions,
}: {
    versions: PackageVersionMap
}): Promise<Map<string, string>> {
    const tags = [...versions.entries()].map((packageVersionEntry: string[]) => {
        const [packageIdent, packageVersion] = packageVersionEntry
        const tag = `${packageIdent}@${packageVersion}`
        return [packageIdent, tag]
    })

    const packageTags = new Map<string, string>()
    for (const tag of tags) {
        if (!tag) continue
        packageTags.set(tag[0], tag[1])
    }

    return packageTags
}

export default determineGitTags
