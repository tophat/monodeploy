import logging from 'monodeploy-logging'

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
                    if (config.git.push) {
                        await gitPush(tag, {
                            cwd: config.cwd,
                            remote: config.git.remote,
                        })
                    }
                }

                logging.info(
                    `[Push Tag]${
                        config.git.push ? '' : ' [Skipped]'
                    } ${tag} (remote: ${config.git.remote})`,
                )
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
