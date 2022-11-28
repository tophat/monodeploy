import {
    gitAdd,
    gitCommit,
    gitGlob,
    gitPull,
    gitPush,
    gitPushTags,
    gitResolveSha,
} from '@monodeploy/git'
import logging from '@monodeploy/logging'
import { type MonodeployConfiguration, type YarnContext } from '@monodeploy/types'

import createReleaseGitTags from './createReleaseGitTags'

export const createPublishCommit = async ({
    config,
    context,
    gitTags,
}: {
    config: MonodeployConfiguration
    context: YarnContext
    gitTags?: Map<string, string>
}): Promise<{ headSha: string } | undefined> => {
    if (config.dryRun) {
        logging.info('[Publish] Creating publish commit', {
            report: context?.report,
        })
        return undefined
    }

    if (config.autoCommit) {
        // Push artifacts (changelog, package.json changes)
        const globs = ['yarn.lock', 'package.json', '**/package.json', '.pnp.*']
        if (config?.changelogFilename) {
            globs.push(config.changelogFilename.replace('<packageDir>', '**'))
        }
        const files = await gitGlob(globs, { cwd: config.cwd, context })
        if (files.length) {
            await gitAdd(files, { cwd: config.cwd, context })
            await gitCommit(config.autoCommitMessage, { cwd: config.cwd, context })
        }
    }

    if (config.git.tag && gitTags?.size) {
        // Tag commit
        await createReleaseGitTags({
            config,
            context,
            gitTags,
        })
    }

    if (config.git.push && config.autoCommit) {
        await gitPull({
            cwd: config.cwd,
            remote: config.git.remote,
            context,
        })
    }

    return { headSha: await gitResolveSha('HEAD', { cwd: config.cwd, context }) }
}

export const pushPublishCommit = async ({
    config,
    context,
    gitTags,
    dryRun = config.dryRun,
}: {
    config: MonodeployConfiguration
    context: YarnContext
    gitTags?: Map<string, string>
    dryRun?: boolean
}): Promise<void> => {
    if (!config.git.push) {
        return
    }

    if (config.autoCommit) {
        await gitPush({
            cwd: config.cwd,
            remote: config.git.remote,
            context,
            dryRun,
        })
        if (config.git.tag && gitTags?.size) {
            await gitPushTags({
                cwd: config.cwd,
                remote: config.git.remote,
                context,
                dryRun,
            })
        }
    } else {
        if (config.git.tag && gitTags?.size) {
            // Push tags only outside of auto-commit mode, otherwise
            // we'll push them after we push the commit
            await gitPushTags({
                cwd: config.cwd,
                remote: config.git.remote,
                context,
                dryRun,
            })
        }
    }
}
