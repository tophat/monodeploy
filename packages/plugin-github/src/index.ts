import { Octokit } from '@octokit/core'
import { throttling } from '@octokit/plugin-throttling'

import { parseRepositoryProperty } from '@monodeploy/git'
import logging from '@monodeploy/logging'
import { PluginHooks } from '@monodeploy/types'

const GitHubPlugin = ({ onReleaseAvailable }: PluginHooks): void => {
    onReleaseAvailable.tapPromise(
        'MonodeployGitHubPlugin',
        async (context, changeset): Promise<void> => {
            const personalAccessToken = process.env.GH_TOKEN
            if (!personalAccessToken) {
                throw new Error('Missing GitHub Personal Access Token')
            }

            const ThrottledOctokit = Octokit.plugin(throttling)
            const octokit = new ThrottledOctokit({
                auth: personalAccessToken,
                throttle: {
                    onRateLimit: () => true,
                    onAbuseLimit: () => {
                        /* ignore */
                    },
                },
            })

            const { owner, repository: repo } = await parseRepositoryProperty(
                context.workspace,
            )

            if (!owner || !repo) {
                throw new Error('Cannot determine GitHub owner or repository')
            }

            for (const [pkgName, changeData] of Object.entries(changeset)) {
                const tag = `${pkgName}@${changeData.version}`
                logging.info(`[GitHub Plugin] Creating release for ${tag}`, {
                    report: context.report,
                })
                await octokit.request('POST /repos/{owner}/{repo}/releases', {
                    owner,
                    repo,
                    tag_name: tag,
                    name: tag,
                    body: changeData.changelog ?? '',
                    draft: false,
                    prerelease: false,
                })
            }
        },
    )
}

export default GitHubPlugin
