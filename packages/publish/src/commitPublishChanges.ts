import { gitAdd, gitCommit, gitGlob, gitPull, gitPush, gitPushTags } from '@monodeploy/git'
import logging from '@monodeploy/logging'
import { MonodeployConfiguration, YarnContext } from '@monodeploy/types'

import createReleaseGitTags from './createReleaseGitTags'

const commitPublishChanges = async ({
    config,
    context,
    gitTags,
}: {
    config: MonodeployConfiguration
    context: YarnContext
    gitTags?: Map<string, string>
}): Promise<void> => {
    if (config.dryRun) {
        logging.info('[Publish] Committing changes', {
            report: context?.report,
        })
        return
    }

    if (config.autoCommit) {
        // Push artifacts (changelog, package.json changes)
        const globs = ['yarn.lock', 'package.json', '**/package.json', '.pnp.*']
        if (config?.changelogFilename) {
            globs.push(config.changelogFilename.replace('<packageDir>', '**'))
        }
        const files = await gitGlob(globs, { cwd: config.cwd, context })

        await gitAdd(files, { cwd: config.cwd, context })
        await gitCommit(config.autoCommitMessage, { cwd: config.cwd, context })
    }

    if (config.git.tag && gitTags) {
        // Tag commit
        await createReleaseGitTags({
            config,
            context,
            gitTags,
        })

        // Push tags only outside of auto-commit mode, otherwise
        // we'll push them after we push the commit
        if (config.git.push && !config.autoCommit) {
            await gitPushTags({
                cwd: config.cwd,
                remote: config.git.remote,
                context,
            })
        }
    }

    if (config.autoCommit && config.git.push) {
        await gitPull({
            cwd: config.cwd,
            remote: config.git.remote,
            context,
        })
        await gitPush({
            cwd: config.cwd,
            remote: config.git.remote,
            context,
        })
        if (config.git.tag && gitTags) {
            await gitPushTags({
                cwd: config.cwd,
                remote: config.git.remote,
                context,
            })
        }
    }
}

export default commitPublishChanges
