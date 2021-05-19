import { PluginHooks } from '@monodeploy/types'

const GitHubPlugin = ({ onReleaseAvailable }: PluginHooks): void => {
    onReleaseAvailable.tapPromise(
        'MonodeployGitHubPlugin',
        async (context, changeset): Promise<void> => {
            console.log('Hi')
        },
    )
}

export default GitHubPlugin
