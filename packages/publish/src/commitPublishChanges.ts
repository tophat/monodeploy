import fs from 'fs'

import { gitAdd, gitCheckIgnore, gitCommit, gitPull, gitPush, gitPushTags } from '@monodeploy/git'
import logging from '@monodeploy/logging'
import { MonodeployConfiguration, YarnContext } from '@monodeploy/types'
import micromatch from 'micromatch'

const commitPublishChanges = async ({
    config,
    context,
}: {
    config: MonodeployConfiguration
    context: YarnContext
}): Promise<void> => {
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
        const files = ['yarn.lock', 'package.json', '"**/package.json"']
        if (config?.changelogFilename) {
            files.push(`"${config.changelogFilename.replace('<packageDir>', '**')}"`)
        }

        const topLevelFiles = await fs.promises.readdir(config.cwd)
        for (const file of micromatch(topLevelFiles, '.pnp.*')) {
            if (!(await gitCheckIgnore(file, { cwd: config.cwd, context }))) {
                files.push(file)
            }
        }

        await gitAdd(files, { cwd: config.cwd, context })
        await gitCommit(config.autoCommitMessage, { cwd: config.cwd, context })

        if (config.git.push) {
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
        }
    }
}

export default commitPublishChanges
