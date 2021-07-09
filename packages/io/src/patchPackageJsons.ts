import type {
    MonodeployConfiguration,
    PackageVersionMap,
    YarnContext,
} from '@monodeploy/types'
import { Descriptor, Manifest, Workspace, structUtils } from '@yarnpkg/core'
import { ppath, xfs } from '@yarnpkg/fslib'

const patchPackageJsons = async (
    config: MonodeployConfiguration,
    context: YarnContext,
    workspaces: Set<Workspace>,
    registryTags: PackageVersionMap,
): Promise<void> => {
    const regenerateManifestRaw = async (
        workspace: Workspace,
    ): Promise<void> => {
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

        const workspaceProtocols: {
            dependencies: Array<Descriptor>
            peerDependencies: Array<Descriptor>
        } = {
            dependencies: [],
            peerDependencies: [],
        }

        workspace.manifest.version = version
        for (const dependentSetKey of [
            'dependencies',
            'peerDependencies',
        ] as const) {
            const dependencySet =
                workspace.manifest.getForScope(dependentSetKey)

            for (const descriptor of dependencySet.values()) {
                const depPackageName = structUtils.stringifyIdent(descriptor)

                const dependencyVersion = registryTags.get(depPackageName)
                if (!dependencyVersion) continue

                const dependencyIdent = structUtils.convertToIdent(descriptor)

                // If dependency is using "workspace:" protocol, preserve it when
                // persisting manifest
                if (descriptor.range.startsWith('workspace:')) {
                    workspaceProtocols[dependentSetKey].push(
                        structUtils.makeDescriptor(
                            dependencyIdent,
                            `workspace:^${dependencyVersion}`,
                        ),
                    )
                }

                const updatedDescriptor = structUtils.makeDescriptor(
                    dependencyIdent,
                    `^${dependencyVersion}`,
                )
                dependencySet.set(
                    updatedDescriptor.identHash,
                    updatedDescriptor,
                )
            }
        }

        // Publishing uses `workspace.manifest.raw` via packUtils here:
        // https://github.com/yarnpkg/berry/blob/9d1734d3fcaba1e1fa1f0077005c248166ba1ef6/packages/plugin-pack/sources/packUtils.ts#L142-L142.
        // If this genPackageManifest script ever changes to use the file from disk, we'll need to re-order the monodeploy
        // pipeline such that we defer restoring workspaces until _after_ publish.
        await regenerateManifestRaw(workspace)

        // Persist manifest with workspace protocols replaced. We can't use
        // Manifest.persistManifest as it modifies manifest.raw.
        const data: Record<string, unknown> = {}
        workspace.manifest.exportTo(data)

        // Restore "workspace" protocols where used.
        // Note: only really need to do this if the user wants the manifest persisted
        if (config.persistVersions) {
            for (const [dependentSetKey, descriptors] of Object.entries(
                workspaceProtocols,
            )) {
                for (const descriptor of descriptors) {
                    const identString = structUtils.stringifyIdent(descriptor)
                    const dependencySet = (data[dependentSetKey] ??
                        {}) as Record<string, string>
                    dependencySet[identString] = descriptor.range
                    data[dependentSetKey] = dependencySet
                }
            }
        }

        const path = ppath.join(workspace.cwd, Manifest.fileName)
        const content = `${JSON.stringify(
            data,
            null,
            workspace.manifest.indent,
        )}\n`

        if (!config.dryRun) {
            await xfs.changeFilePromise(path, content, {
                automaticNewlines: true,
            })
        }
    }

    await Promise.all([...workspaces].map(patchWorkspace))
}

export default patchPackageJsons
