import { gitTag } from '@monodeploy/git'
import logging from '@monodeploy/logging'
import type {
    MonodeployConfiguration,
    PackageTagMap,
    YarnContext,
} from '@monodeploy/types'

async function createReleaseGitTags({
    config,
    context,
    versions,
}: {
    config: MonodeployConfiguration
    context: YarnContext
    versions: PackageTagMap
}): Promise<Map<string, string>> {
    const tags = await Promise.all(
        [...versions.entries()].map(async (packageVersionEntry: string[]) => {
            const [packageIdent, packageVersion] = packageVersionEntry
            const tag = `${packageIdent}@${packageVersion}`

            try {
                if (!config.dryRun) {
                    await gitTag(tag, { cwd: config.cwd, context })
                }

                logging.info(`[Tag] ${tag}`, { report: context.report })

                return [packageIdent, tag]
            } catch (e) {
                logging.error(`[Tag] Failed ${tag}`, { report: context.report })
                logging.error(e, { report: context.report })
            }
            return null
        }),
    )

    const packageTags = new Map<string, string>()
    for (const tag of tags) {
        if (!tag) continue
        packageTags.set(tag[0], tag[1])
    }

    return packageTags
}

export default createReleaseGitTags
