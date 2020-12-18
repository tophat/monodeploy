import { Configuration, Project } from '@yarnpkg/core'
import { PortablePath } from '@yarnpkg/fslib'
import NpmPlugin from '@yarnpkg/plugin-npm'
import type { MonodeployConfiguration, YarnContext } from './types'

import getLatestPackageTags from './core/getLatestPackageTags'
import getPendingVersionBumps from './core/getPendingVersionBumps'
import patchPackageJsons from './core/patchPackageJsons'

import getRegistryUrl from './utils/getRegistryUrl'
import { backupPackageJsons, restorePackageJsons } from './utils/backupPackage'

const monodeploy = async (config: MonodeployConfiguration): Promise<void> => {
    const cwd = config.cwd as PortablePath
    const configuration = await Configuration.find(cwd, {
        modules: new Map([['@yarnpkg/plugin-npm', NpmPlugin]]),
        plugins: new Set([`@yarnpkg/plugin-npm`]),
    })
    const { project, workspace } = await Project.find(configuration, cwd)

    if (!workspace) throw new Error(`Workspace required! Cwd: ${cwd}`)

    const context: YarnContext = {
        configuration,
        project,
        workspace,
    }

    // Determine registry
    const registryUrl = await getRegistryUrl(config, context)

    // Fetch latest package versions for workspaces
    const registryTags = await getLatestPackageTags(config, context)

    // Determine version bumps via commit messages
    const versionBumps = await getPendingVersionBumps(config, context)

    // Backup workspace package.jsons
    const backupKey = await backupPackageJsons(config, context)

    try {
        // Update workspace package.jsons
        await patchPackageJsons(config, context, registryTags)

        // Apply releases
        // TODO

        // Publish (+ Git Tags)
        // TODO
    } catch (err) {
        // TODO: Handle errors
    } finally {
        // Restore workspace package.jsons
        await restorePackageJsons(config, context, backupKey)
    }
}

export default monodeploy
