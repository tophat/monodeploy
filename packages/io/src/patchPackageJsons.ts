import { Manifest, Workspace, structUtils } from '@yarnpkg/core'

import type {
    MonodeployConfiguration,
    PackageTagMap,
    YarnContext,
} from '@monodeploy/types'

const patchPackageJsons = async (
    config: MonodeployConfiguration,
    context: YarnContext,
    workspaces: Set<Workspace>,
    registryTags: PackageTagMap,
): Promise<void> => {
    const reloadWorkspace = async (workspace: Workspace): Promise<void> => {
        const data = {}
        workspace.manifest.exportTo(data)
        workspace.manifest.raw = data
    }

    const patchWorkspace = async (workspace: Workspace): Promise<void> => {
        const ident = workspace.manifest.name!
        const pkgName = structUtils.stringifyIdent(ident)
        const version = registryTags.get(pkgName)

        /* istanbul ignore next: unless invoked directly, all packages have a tag */
        if (!version) throw new Error(`${pkgName} is missing a version`)

        workspace.manifest.version = version
        for (const dependentSetKey of Manifest.allDependencies) {
            const dependencySet = workspace.manifest.getForScope(
                dependentSetKey,
            )

            for (const descriptor of dependencySet.values()) {
                const depPackageName = structUtils.stringifyIdent(descriptor)

                const dependencyVersion = registryTags.get(depPackageName)
                if (!dependencyVersion) continue

                const range = `^${dependencyVersion}`
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

        // publishing uses `workspace.manifest.raw` which persistManifest does not update,
        // so we need to reload the manifest object
        await reloadWorkspace(workspace)
    }

    await Promise.all([...workspaces].map(patchWorkspace))
}

export default patchPackageJsons
