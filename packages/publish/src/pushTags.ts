import { gitPushTag, gitTag } from '@monodeploy/git'
import logging from '@monodeploy/logging'
import type {
    MonodeployConfiguration,
    PackageTagMap,
    YarnContext,
} from '@monodeploy/types'

function pushTags(
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
                    if (config.git.push) {
                        await gitPushTag(tag, {
                            cwd: config.cwd,
                            remote: config.git.remote,
                            context,
                        })
                    }
                }

                logging.info(
                    `[Push Tag]${
                        config.git.push ? '' : ' [Skipped]'
                    } ${tag} (remote: ${config.git.remote})`,
                    { report: context.report },
                )
            } catch (e) {
                logging.error(
                    `[Push Tag] Failed ${tag} (remote: ${config.git.remote})`,
                    { report: context.report },
                )
                logging.error(e, { report: context.report })
            }
        }),
    )
}

export default pushTags
