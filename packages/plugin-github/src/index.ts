import { Octokit } from '@octokit/core'

import { PluginHooks } from '@monodeploy/types'

const GitHubPlugin = ({ onReleaseAvailable }: PluginHooks): void => {
    onReleaseAvailable.tapPromise(
        'MonodeployGitHubPlugin',
        async (context, changeset): Promise<void> => {
            const personalAccessToken = process.env.GH_TOKEN
            if (!personalAccessToken) {
                throw new Error('Missing GitHub Personal Access Token')
            }

            const octokit = new Octokit({ auth: personalAccessToken })

            for (const [pkgName, changeData] of Object.entries(changeset)) {
                await octokit.request('POST /repos/{owner}/{repo}/releases', {
                    owner: '',
                    repo: '',
                    tag_name: '',
                    name: '',
                    body: '',
                    draft: false,
                    prerelease: false,
                })
            }
        },
    )
}

export default GitHubPlugin
