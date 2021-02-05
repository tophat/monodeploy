import { promises as fs } from 'fs'
import path from 'path'

import logging from 'monodeploy-logging'

import type {
    ChangesetSchema,
    MonodeployConfiguration,
    PackageStrategyMap,
    PackageTagMap,
    YarnContext,
} from '../types'
import generateChangelogEntry from '../utils/changelog'

const writeChangesetFile = async (
    config: MonodeployConfiguration,
    context: YarnContext,
    registryTags: PackageTagMap,
    versionStrategies: PackageStrategyMap,
): Promise<ChangesetSchema> => {
    const changesetData: ChangesetSchema = {}

    for (const [pkgName, version] of registryTags.entries()) {
        const changelog = await generateChangelogEntry(
            config,
            context,
            pkgName,
            version,
            versionStrategies.get(pkgName)?.commits ?? [],
        )
        changesetData[pkgName] = {
            version,
            changelog,
        }
    }

    if (!config.changesetFilename) {
        logging.debug(
            `[Changeset] Data`,
            JSON.stringify(changesetData, null, 2),
        )
        return changesetData
    }

    const changesetPath = path.resolve(config.cwd, config.changesetFilename)
    await fs.mkdir(path.dirname(changesetPath), { recursive: true })

    await fs.writeFile(changesetPath, JSON.stringify(changesetData, null, 2), {
        encoding: 'utf8',
    })
    logging.info(`[Changeset] Written to: ${changesetPath}`)

    return changesetData
}

export default writeChangesetFile
