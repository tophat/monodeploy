import { getTopologicalSort } from '@monodeploy/dependencies'
import type { MonodeployConfiguration, YarnContext } from '@monodeploy/types'
import { type Workspace } from '@yarnpkg/core'
import pLimit from 'p-limit'

import determineGitTags from './determineGitTags'
import getWorkspacesToPublish from './getWorkspacesToPublish'
import { createWorkspaceLifecycleExecutor } from './lifecycleExecutor'
import { pack } from './pack'

export { pushPublishCommit, createPublishCommit } from './commitPublishChanges'
export { determineGitTags, getWorkspacesToPublish }

export const publishPackages = async ({
    config,
    context,
    workspaces,
    publishCommitSha,
}: {
    config: MonodeployConfiguration
    context: YarnContext
    workspaces: Set<Workspace>
    publishCommitSha?: string | undefined
}): Promise<void> => {
    const limitPublish = pLimit(config.maxConcurrentWrites || 1)
    const publishTag = config.prerelease ? config.prereleaseNPMTag : 'latest'

    const limit = pLimit(config.jobs || Infinity)
    const groups =
        config.topological || config.topologicalDev
            ? await getTopologicalSort(workspaces, {
                  dev: config.topologicalDev,
              })
            : [[...workspaces]]

    const executeLifecycle = createWorkspaceLifecycleExecutor({ limit, groups, config, context })

    /**
     * Lifecycle: Prepublish
     *
     * Called before packing even starts. NPM will execute this lifecycle script
     * on installs, so it's not recommended to place publish-only scripts here.
     *
     * This is deprecated by NPM in favour of prepublishOnly, however Yarn Modern does
     * not implement prepublishOnly and only implements prepublish.
     */
    await executeLifecycle('prepublish')

    /**
     * Lifecycle: Prepare
     *
     * This is not called by Yarn but called by NPM and by Lerna prior to packing.
     * It is not recommended to use this lifecycle hook for compiling.
     */
    await executeLifecycle('prepare')

    /**
     * Lifecycle: Prepublish Only
     *
     * This is not directly supported by Yarn Modern, however was introduced by NPM as
     * a replacement for the deprecated "Prepublish".
     */
    await executeLifecycle('prepublishOnly')

    /**
     * Lifecycle: Prepack
     *
     * The prepack script should be used to compile packages, e.g.
     * transpiling TypeScript to JavaScript.
     */
    await executeLifecycle('prepack')

    try {
        /**
         * In "pack", we create the package archives and publish to the registry.
         */
        await executeLifecycle((workspace) =>
            pack({ workspace, limitPublish, config, context, publishTag, publishCommitSha }),
        )
    } finally {
        try {
            /**
             * Lifecycle: Postpack
             *
             * Guaranteed to execute after packing the archive.
             */
            await executeLifecycle('postpack')
        } finally {
            /**
             * Lifecycle: Postpublish
             *
             * Guaranteed to execute _after_ postpack.
             */
            await executeLifecycle('postpublish')
        }
    }
}
