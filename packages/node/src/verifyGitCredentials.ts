import { gitPushDryRun } from '@monodeploy/git'
import { MonodeployConfiguration, YarnContext } from '@monodeploy/types'

export async function verifyGitCredentials({
    config,
    context,
}: {
    config: MonodeployConfiguration
    context: YarnContext
}): Promise<void> {
    if (!config.git.push) {
        return
    }

    const canPush = await gitPushDryRun({ context, cwd: config.cwd, remote: config.git.remote })

    if (!canPush) {
        throw new Error('Cannot push to remote repository.')
    }
}
