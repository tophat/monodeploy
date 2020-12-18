import fs from 'fs/promises'

import type {
    MonodeployConfiguration,
    PackageTagMap,
    YarnContext,
} from '../types'

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
            packageManifest.version = registryTags[packageManifest.name]
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
