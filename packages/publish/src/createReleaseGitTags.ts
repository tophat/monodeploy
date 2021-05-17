import { gitTag } from '@monodeploy/git'
import logging from '@monodeploy/logging'
import type {
    MonodeployConfiguration,
    PackageTagMap,
    YarnContext,
} from '@monodeploy/types'

function createReleaseGitTags(
    config: MonodeployConfiguration,
    context: YarnContext,
    versions: PackageTagMap,
): Promise<void[]> {
    return Promise.all(
        [...versions.entries()].map(async (packageVersionEntry: string[]) => {
            const [packageIdent, packageVersion] = packageVersionEntry
            const tag = `${packageIdent}@${packageVersion}`

            try {
                if (!config.dryRun) {
                    await gitTag(tag, { cwd: config.cwd, context })
                }

                logging.info(
                    `[Tag]${config.git.push ? '' : ' [Skipped]'} ${tag}`,
                    { report: context.report },
                )
            } catch (e) {
                logging.error(`[Tag] Failed ${tag}`, { report: context.report })
                logging.error(e, { report: context.report })
            }
        }),
    )
}

export default createReleaseGitTags
