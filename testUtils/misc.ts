import { getPluginConfiguration } from '@yarnpkg/cli'
import { Configuration, Project } from '@yarnpkg/core'
import { PortablePath } from '@yarnpkg/fslib'

import { MonodeployConfiguration, YarnContext } from '@monodeploy/types'

import mergeDefaultConfig from '../packages/node/src/utils/mergeDefaultConfig'

export async function setupContext(cwd: PortablePath): Promise<YarnContext> {
    const configuration = await Configuration.find(
        cwd,
        getPluginConfiguration(),
    )
    const { project, workspace } = await Project.find(configuration, cwd)

    if (!workspace) {
        throw Error('Invalid CWD')
    }

    const context: YarnContext = {
        configuration,
        project,
        workspace,
    }

    return context
}

export async function getMonodeployConfig({
    baseBranch,
    commitSha,
    cwd,
    changelogFilename,
    dryRun,
}: Partial<{
    baseBranch: string
    commitSha: string
    cwd: string
    changelogFilename: string
    dryRun: boolean
}>): Promise<MonodeployConfiguration> {
    return await mergeDefaultConfig({
        cwd,
        git: { baseBranch, commitSha },
        changelogFilename,
        dryRun,
    })
}
