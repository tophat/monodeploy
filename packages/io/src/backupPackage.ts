import { promises as fs } from 'fs'
import os from 'os'
import path from 'path'

import logging from '@monodeploy/logging'
import type { MonodeployConfiguration, YarnContext } from '@monodeploy/types'
import { Report } from '@yarnpkg/core'

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
    report,
    key,
}: {
    report: Report
    key: string
}): Promise<void> => {
    logging.debug(`[Savepoint] Restoring modified working tree (key: ${key})`, { report })

    const map = JSON.parse(await fs.readFile(path.join(key, 'map.json'), 'utf-8'))
    const entries = Object.entries(map) as [string, string][]

    const progress = Report.progressViaCounter(entries.length)
    report.reportProgress(progress)

    const restoreFile = async (index: string, filename: string): Promise<void> => {
        const src = path.join(key, index)
        await fs.copyFile(src, filename)
    }

    await Promise.all(
        entries.map(([index, filename]) =>
            restoreFile(index, filename).finally(() => progress.tick()),
        ),
    )
}

export const clearBackupCache = async ({
    report,
    keys,
}: {
    report: Report
    keys: string[]
}): Promise<void> => {
    logging.debug('[Savepoint] Deleting temporary savepoint files', { report })

    const progress = Report.progressViaCounter(keys.length)
    report.reportProgress(progress)

    await Promise.all(
        keys.map((key) =>
            fs.rm(key, { recursive: true, force: true }).finally(() => progress.tick()),
        ),
    )
}
