import {
    gitAdd,
    gitClean,
    gitCommit,
    gitGlob,
    gitPull,
    gitPush,
    gitPushTags,
    gitResetHard,
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
        const globs: string[] = []

        if (config.persistVersions) {
            // Push package.json and related changes
            globs.push('yarn.lock', 'package.json', '**/package.json', '.pnp.*')
        }
        if (config.changelogFilename) {
            // Push changelog changes
            globs.push(config.changelogFilename.replace('<packageDir>', '**'))
        }

        console.log('1')
        const files = globs.length ? await gitGlob(globs, { cwd: config.cwd, context }) : []
        console.log('2')
        if (files.length) {
            console.log('3')
            await gitAdd(files, { cwd: config.cwd, context })
            console.log('4')
            await gitCommit(config.autoCommitMessage, { cwd: config.cwd, context })
            console.log('5')

            // clean up any files that were modified but not committed
            await gitResetHard({ cwd: config.cwd, context })
            console.log('6')
            await gitClean({ cwd: config.cwd, context })
            console.log('7')
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
