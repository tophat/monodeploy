import { parseRepositoryProperty } from '@monodeploy/git'
import logging from '@monodeploy/logging'
import {
    ChangesetRecord,
    ChangesetSchema,
    MonodeployConfiguration,
    YarnContext,
} from '@monodeploy/types'
import { Octokit } from '@octokit/core'
import { throttling } from '@octokit/plugin-throttling'

export const PluginName = 'GitHub Plugin'

export const PluginInternals = async (
    context: YarnContext,
    config: MonodeployConfiguration,
    changeset: ChangesetSchema,
): Promise<void> => {
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

    const { owner, repository: repo } = await parseRepositoryProperty(context.workspace)

    if (!owner || !repo) {
        throw new Error('Cannot determine GitHub owner or repository')
    }

    const changesByTag = new Map<string, Array<ChangesetRecord & { name: string }>>()
    for (const [pkgName, changeData] of Object.entries(changeset)) {
        const tag = changeData.tag
        if (!tag) {
            throw new Error(`Missing package git tag for ${pkgName}`)
        }
        if (!changeData.changelog) {
            logging.info(
                `[${PluginName}] Skipping release for ${changeData.tag} as there's no changelog.`,
                {
                    report: context.report,
                },
            )
            continue
        }

        const changes = changesByTag.get(tag) ?? []
        changes.push({ ...changeData, name: pkgName })
        changesByTag.set(tag, changes)
    }

    const sortedEntries = Array.from(changesByTag.entries()).sort(
        ([tagA, changesA], [tagB, changesB]) => {
            // sort by number of changes in descending order, then by name, reversed so the release with
            // largest number of changes appears first in GitHub.

            if (changesA.length === changesB.length) {
                return tagB.localeCompare(tagA)
            }
            return changesB.length - changesA.length
        },
    )
    for (const [tag, changes] of sortedEntries) {
        logging.info(`[${PluginName}] Creating release for ${tag}`, {
            report: context.report,
        })

        if (config.dryRun) continue

        const combinedChangelog = changes
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((change) => change.changelog)
            .join('\n')

        await octokit.request('POST /repos/{owner}/{repo}/releases', {
            owner,
            repo,
            tag_name: tag,
            name: tag,
            body: combinedChangelog,
            draft: false,
            prerelease: config.prerelease,
        })
    }
}
