import { Manifest, Workspace, structUtils } from '@yarnpkg/core'

import type {
    MonodeployConfiguration,
    PackageTagMap,
    YarnContext,
} from 'monodeploy-types'

const patchPackageJsons = async (
    config: MonodeployConfiguration,
    context: YarnContext,
    workspaces: Set<Workspace>,
    registryTags: PackageTagMap,
): Promise<void> => {
    await Promise.all(
        [...workspaces].map(async (workspace: Workspace) => {
            const ident = workspace.manifest.name
            if (!ident) return

            const pkgName = structUtils.stringifyIdent(ident)
            const version = registryTags.get(pkgName)
            if (!version) return

            workspace.manifest.version = version
            for (const dependentSetKey of Manifest.allDependencies) {
                const dependencySet = workspace.manifest.getForScope(
                    dependentSetKey,
                )
                if (!dependencySet) continue

                for (const descriptor of dependencySet.values()) {
                    const depPackageName = structUtils.stringifyDescriptor(
                        descriptor,
                    )

                    if (!registryTags.get(depPackageName)) continue
                    const range = `^${registryTags.get(depPackageName)}`
                    const updatedDescriptor = structUtils.makeDescriptor(
                        structUtils.convertToIdent(descriptor),
                        range,
                    )
                    dependencySet.set(
                        updatedDescriptor.identHash,
                        updatedDescriptor,
                    )
                }
            }

            await workspace.persistManifest()
        }),
    )
}

export default patchPackageJsons
