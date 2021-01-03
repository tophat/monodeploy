import { promises as fs } from 'fs'
import path from 'path'

import logging from '../logging'
import type {
    ChangesetSchema,
    MonodeployConfiguration,
    PackageTagMap,
    YarnContext,
} from '../types'

const writeChangesetFile = async (
    config: MonodeployConfiguration,
    context: YarnContext,
    registryTags: PackageTagMap,
): Promise<ChangesetSchema> => {
    const changesetData: ChangesetSchema = {}

    for (const [pkgName, version] of registryTags.entries()) {
        changesetData[pkgName] = { version }
    }

    if (!config.changesetFilename) return changesetData

    const changesetPath = path.resolve(config.cwd, config.changesetFilename)
    await fs.mkdir(path.dirname(changesetPath), { recursive: true })

    await fs.writeFile(changesetPath, JSON.stringify(changesetData, null, 2), {
        encoding: 'utf8',
    })
    logging.info(`[Changeset] Written to: ${changesetPath}`)

    return changesetData
}

export default writeChangesetFile
