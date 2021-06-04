import { parseRepositoryProperty } from '@monodeploy/git'
import logging from '@monodeploy/logging'
import { PluginHooks } from '@monodeploy/types'
import { Octokit } from '@octokit/core'
import { throttling } from '@octokit/plugin-throttling'

export const PluginName = 'GitHub Plugin'

const GitHubPlugin = ({
    onReleaseAvailable,
}: Pick<PluginHooks, 'onReleaseAvailable'>): void => {
    onReleaseAvailable.tapPromise(
        PluginName,
        async (context, config, changeset): Promise<void> => {
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
                if (!changeData.tag) {
                    throw new Error(`Missing package git tag for ${pkgName}`)
                }

                logging.info(
                    `[${PluginName}] Creating release for ${changeData.tag}`,
                    {
                        report: context.report,
                    },
                )
                if (!config.dryRun) {
                    await octokit.request(
                        'POST /repos/{owner}/{repo}/releases',
                        {
                            owner,
                            repo,
                            tag_name: changeData.tag,
                            name: changeData.tag,
                            body: changeData.changelog ?? '',
                            draft: false,
                            prerelease: false,
                        },
                    )
                }
            }
        },
    )
}

export default GitHubPlugin
