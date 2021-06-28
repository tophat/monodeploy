import { promises as fs } from 'fs'
import path from 'path'

import logging from '@monodeploy/logging'
import type {
    ChangesetSchema,
    MonodeployConfiguration,
    PackageStrategyMap,
    PackageVersionMap,
    YarnContext,
} from '@monodeploy/types'

import generateChangelogEntry from './changelog'

const writeChangesetFile = async ({
    config,
    context,
    previousTags,
    nextTags,
    versionStrategies,
    createdGitTags,
}: {
    config: MonodeployConfiguration
    context: YarnContext
    previousTags: PackageVersionMap
    nextTags: PackageVersionMap
    versionStrategies: PackageStrategyMap
    createdGitTags?: Map<string, string>
}): Promise<ChangesetSchema> => {
    const changesetData: ChangesetSchema = {}

    for (const [packageName, newVersion] of nextTags.entries()) {
        const previousVersion = previousTags.get(packageName) ?? null
        const changelog = await generateChangelogEntry({
            config,
            context,
            packageName,
            previousVersion,
            newVersion,
            commits: versionStrategies.get(packageName)?.commits ?? [],
        })
        changesetData[packageName] = {
            version: newVersion,
            changelog,
            tag: createdGitTags?.get(packageName) ?? null,
        }
    }

    if (!config.changesetFilename) {
        logging.debug(`[Changeset] Data`, {
            extras: JSON.stringify(changesetData, null, 2),
            report: context.report,
        })
        return changesetData
    }

    const serializedData = JSON.stringify(changesetData, null, 2)

    if (config.changesetFilename === '-') {
        console.log(serializedData)
    } else {
        const changesetPath = path.resolve(config.cwd, config.changesetFilename)
        await fs.mkdir(path.dirname(changesetPath), { recursive: true })

        await fs.writeFile(changesetPath, serializedData, {
            encoding: 'utf8',
        })
        logging.info(`[Changeset] Written to: ${changesetPath}`, {
            report: context.report,
        })
    }

    return changesetData
}

export default writeChangesetFile
