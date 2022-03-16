import fs from 'fs'
import path from 'path'

import type { ChangesetSchema, MonodeployConfiguration } from '@monodeploy/types'
import { npath } from '@yarnpkg/fslib'

async function read() {
    const data: Uint8Array[] = []
    for await (const datum of process.stdin) data.push(datum)
    return Buffer.concat(data).toString('utf8')
}

export const readChangesetFile = async ({
    config,
}: {
    config: MonodeployConfiguration
}): Promise<ChangesetSchema> => {
    if (!config.changesetFilename) {
        throw new Error('No input changeset file specified.')
    }

    const data =
        config.changesetFilename === '-'
            ? await read()
            : await fs.promises.readFile(
                  path.resolve(config.cwd, npath.fromPortablePath(config.changesetFilename)),
                  {
                      encoding: 'utf8',
                  },
              )

    // TODO: some validation?
    return JSON.parse(data)
}
