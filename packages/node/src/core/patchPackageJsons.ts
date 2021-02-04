import { Manifest, Workspace, structUtils } from '@yarnpkg/core'

import type {
    MonodeployConfiguration,
    PackageTagMap,
    YarnContext,
} from '../types'

const identPartsToPackageName = (scope: string | null, name: string): string =>
    scope ? `@${scope}/${name}` : name

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

            const pkgName = identPartsToPackageName(ident.scope, ident.name)
            const version = registryTags.get(pkgName)
            if (!version) return

            workspace.manifest.version = version
            for (const dependentSetKey of Manifest.allDependencies) {
                const dependencySet = workspace.manifest[dependentSetKey]
                if (!dependencySet) continue

                for (const [, descriptor] of dependencySet.entries()) {
                    const depPackageName = identPartsToPackageName(
                        descriptor.scope,
                        descriptor.name,
                    )

                    if (!registryTags.get(depPackageName)) continue
                    const range = `^${registryTags.get(depPackageName)}`
                    const updatedDescriptor = structUtils.makeDescriptor(
                        structUtils.makeIdent(
                            descriptor.scope,
                            descriptor.name,
                        ),
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
