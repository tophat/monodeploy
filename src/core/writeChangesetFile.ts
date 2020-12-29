import { promises as fs } from 'fs'
import path from 'path'

import logging from '../logging'
import type {
    MonodeployConfiguration,
    PackageTagMap,
    YarnContext,
} from '../types'

interface ChangesetSchema {
    [version: string]: { version: string }
}

const writeChangesetFile = async (
    config: MonodeployConfiguration,
    context: YarnContext,
    registryTags: PackageTagMap,
): Promise<void> => {
    if (!config.changesetFilename) return

    const changesetPath = path.resolve(config.cwd, config.changesetFilename)
    await fs.mkdir(path.dirname(changesetPath), { recursive: true })
    const changesetData: ChangesetSchema = {}

    for (const [pkgName, version] of registryTags.entries()) {
        changesetData[pkgName] = { version }
    }

    await fs.writeFile(changesetPath, JSON.stringify(changesetData, null, 2), {
        encoding: 'utf8',
    })
    logging.info(`Changeset written to: ${changesetPath}`)
}

export default writeChangesetFile
