import fs from 'fs/promises'
import { Manifest } from '@yarnpkg/core'

import type {
    MonodeployConfiguration,
    PackageTagMap,
    YarnContext,
} from '../types'

import logging from '../logging'

import getPackageJsonPaths from '../utils/getPackageJsonPaths'

const patchPackageJsons = async (
    config: MonodeployConfiguration,
    context: YarnContext,
    registryTags: PackageTagMap,
): Promise<void> => {
    const packageJsonPaths = await getPackageJsonPaths(config, context)

    await Promise.all(
        packageJsonPaths.map(async filename => {
            const packageManifest = JSON.parse(
                await fs.readFile(filename, 'utf-8'),
            )
            packageManifest.version = registryTags.get(packageManifest.name)

            for (const dependentSetKey of Manifest.allDependencies) {
                const dependencySet = packageManifest[dependentSetKey]
                if (!dependencySet) continue
                for (const packageName of Object.keys(dependencySet)) {
                    if (!registryTags.get(packageName)) continue
                    dependencySet[packageName] = `^${registryTags.get(
                        packageName,
                    )}`
                }
            }

            const updatedPackageManifest = JSON.stringify(
                packageManifest,
                null,
                2,
            )
            await fs.writeFile(filename, `${updatedPackageManifest}\n`, 'utf-8')
        }),
    )
}

export default patchPackageJsons
