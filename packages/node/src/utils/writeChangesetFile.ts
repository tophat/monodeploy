import { promises as fs } from 'fs'
import path from 'path'

import logging from '@monodeploy/logging'
import type { ChangesetSchema, MonodeployConfiguration, YarnContext } from '@monodeploy/types'
import { npath } from '@yarnpkg/fslib'

export const writeChangesetFile = async ({
    config,
    context,
    changeset,
}: {
    config: MonodeployConfiguration
    context: YarnContext
    changeset: ChangesetSchema
}): Promise<void> => {
    if (!config.changesetFilename) {
        logging.debug('[Changeset] Data', {
            extras: JSON.stringify(changeset, null, 2),
            report: context.report,
        })
        return
    }

    const serializedData = JSON.stringify(changeset, null, 2)

    if (config.changesetFilename === '-') {
        console.log(serializedData)
    } else {
        const changesetPath = path.resolve(
            config.cwd,
            npath.fromPortablePath(config.changesetFilename),
        )
        await fs.mkdir(path.dirname(changesetPath), { recursive: true })

        await fs.writeFile(changesetPath, serializedData, {
            encoding: 'utf8',
        })
        logging.info(`[Changeset] Written to: ${changesetPath}`, {
            report: context.report,
        })
    }
}
