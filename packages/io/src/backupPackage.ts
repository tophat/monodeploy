import { promises as fs } from 'fs'
import os from 'os'
import path from 'path'

import type { MonodeployConfiguration, YarnContext } from '@monodeploy/types'

import getPackageJsonPaths from './getPackageJsonPaths'

export const backupPackageJsons = async ({
    config,
    context,
}: {
    config: MonodeployConfiguration
    context: YarnContext
}): Promise<string> => {
    const packageJsonPaths = await getPackageJsonPaths(config, context)
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'package-jsons-'))
    await Promise.all(
        packageJsonPaths.map(async (packageJsonPath, index) =>
            fs.copyFile(packageJsonPath, path.join(tmpDir, String(index))),
        ),
    )
    const mapFilename = path.join(tmpDir, 'map.json')
    const map = { ...packageJsonPaths }
    await fs.writeFile(mapFilename, JSON.stringify(map, null, 2))
    return tmpDir
}

export const restorePackageJsons = async ({
    key,
}: {
    key: string
}): Promise<void> => {
    const map = JSON.parse(
        await fs.readFile(path.join(key, 'map.json'), 'utf-8'),
    )
    await Promise.all(
        (Object.entries(map) as [string, string][]).map(
            async ([index, filename]) => {
                const src = path.join(key, index)
                await fs.copyFile(src, filename)
            },
        ),
    )
}

export const clearBackupCache = async ({
    keys,
}: {
    keys: string[]
}): Promise<void> => {
    await Promise.all(
        keys.map(
            async (key) => await fs.rm(key, { recursive: true, force: true }),
        ),
    )
}
