import { gitAdd, gitCommit, gitPush, gitPushTags } from '@monodeploy/git'
import logging from '@monodeploy/logging'
import { MonodeployConfiguration, YarnContext } from '@monodeploy/types'

const commitPublishChanges = async (
    config: MonodeployConfiguration,
    context: YarnContext,
): Promise<void> => {
    if (config.dryRun) {
        logging.info('[Publish] Committing changes', {
            report: context?.report,
        })
        return
    }

    // Push tags
    if (config.git.push && config.git.tag) {
        await gitPushTags({
            cwd: config.cwd,
            remote: config.git.remote,
            context,
        })
    }

    if (config.autoCommit) {
        // Push artifacts (changelog, package.json changes)
        await gitAdd(
            ['yarn.lock', config?.changelogFilename ?? '', '"**/package.json"'],
            { cwd: config.cwd },
        )
        await gitCommit(config.autoCommitMessage, { cwd: config.cwd, context })

        if (config.git.push) {
            await gitPush({
                cwd: config.cwd,
                remote: config.git.remote,
                context,
            })
        }
    }
}

export default commitPublishChanges
