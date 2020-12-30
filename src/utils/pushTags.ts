import { execSync } from 'child_process'

import logging from '../logging'
import type {
    MonodeployConfiguration,
    PackageTagMap,
    YarnContext,
} from '../types'

function pushTags(
    config: MonodeployConfiguration,
    context: YarnContext,
    versions: PackageTagMap,
): Promise<void[]> {
    return Promise.all(
        [...versions.entries()].map((packageVersionEntry: string[]) => {
            const [packageIdent, packageVersion] = packageVersionEntry
            const tag = `${packageIdent}@${packageVersion}`

            try {
                if (!config.dryRun) {
                    // TODO: Tidy.
                    execSync(`git tag ${tag}`, { encoding: 'utf8' })
                    execSync(`git push ${config.git.remote} ${tag}`, {
                        encoding: 'utf8',
                    })
                }

                logging.info(
                    `Pushed tag '${tag}' to remote '${config.git.remote}'.`,
                )
            } catch (e) {
                logging.error(`Failed to push tag ${tag} to remote.`)
                logging.error(e)
            }
        }),
    )
}

export default pushTags
