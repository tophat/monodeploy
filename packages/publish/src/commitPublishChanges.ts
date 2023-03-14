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

    if (config.git.tag && gitTags?.size && !config.persistVersions) {
        // If not using persistVersions, we'll attach the git tag to the commit
        // that we're running monodeploy against since this marks the commit as the
        // "last one published". This informs later monodeploy runs so that they don't republish
        // the changes.
        await createReleaseGitTags({
            config,
            context,
            gitTags,
        })
    }

    if (config.autoCommit) {
        const globs: string[] = []

        if (config.persistVersions) {
            // Push package.json and related changes
            globs.push('yarn.lock', 'package.json', '**/package.json', '.pnp.*')
        }
        if (config.changelogFilename) {
            // Push changelog changes
            globs.push(config.changelogFilename.replace('<packageDir>', '**'))
        }

        const files = globs.length ? await gitGlob(globs, { cwd: config.cwd, context }) : []
        if (files.length) {
            await gitAdd(files, { cwd: config.cwd, context })
            await gitCommit(config.autoCommitMessage, { cwd: config.cwd, context })
        }
    }

    if (config.git.push && config.autoCommit) {
        await gitPull({
            cwd: config.cwd,
            remote: config.git.remote,
            context,
            autostash: true,
            strategyOption: 'theirs',
        })
    }

    if (config.git.tag && gitTags?.size && config.persistVersions) {
        // If using persistVersions, we attach the git tag to the commit with
        // the modified package.json files and changelogs. This does mean that we are
        // subject to a race condition where 2 changes going out at the same time might
        // result in the latter change missing commits. This is an inherent flaw with using
        // git tags to determine the last publish checkpoint.
        await createReleaseGitTags({
            config,
            context,
            gitTags,
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
