import logging from '../logging'
import type {
    MonodeployConfiguration,
    PackageTagMap,
    YarnContext,
} from '../types'

import { gitPush, gitTag } from './git'

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
                    await gitTag(tag, { cwd: config.cwd })
                    await gitPush(tag, {
                        cwd: config.cwd,
                        remote: config.git.remote,
                    })
                }

                logging.info(`[Push Tag] ${tag} (remote: ${config.git.remote})`)
            } catch (e) {
                logging.error(
                    `[Push Tag] Failed ${tag} (remote: ${config.git.remote})`,
                )
                logging.error(e)
            }
        }),
    )
}

export default pushTags
