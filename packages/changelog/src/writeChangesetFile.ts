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
import { npath } from '@yarnpkg/fslib'

import generateChangelogEntry from './changelog'

const writeChangesetFile = async ({
    config,
    context,
    previousTags,
    nextTags,
    versionStrategies,
    gitTags,
    workspaceGroups,
}: {
    config: MonodeployConfiguration
    context: YarnContext
    previousTags: PackageVersionMap
    nextTags: PackageVersionMap
    versionStrategies: PackageStrategyMap
    gitTags?: Map<string, string>
    workspaceGroups: Map<string, Set<string>>
}): Promise<ChangesetSchema> => {
    const changesetData: ChangesetSchema = {}

    for (const [packageName, newVersion] of nextTags.entries()) {
        const previousVersion = previousTags.get(packageName) ?? null
        const versionStrategy = versionStrategies.get(packageName)
        const changelog = await generateChangelogEntry({
            config,
            context,
            packageName,
            previousVersion,
            newVersion,
            commits: versionStrategy?.commits ?? [],
        })
        changesetData[packageName] = {
            version: newVersion,
            previousVersion: previousVersion,
            changelog,
            tag: gitTags?.get(packageName) ?? null,
            strategy: versionStrategy?.type ?? null,
            group: packageName, // overwritten below
        }
    }

    for (const [groupKey, group] of workspaceGroups.entries()) {
        for (const packageName of group) {
            if (!changesetData[packageName]) continue
            changesetData[packageName].group = groupKey ?? packageName
        }
    }

    if (!config.changesetFilename) {
        logging.debug('[Changeset] Data', {
            extras: JSON.stringify(changesetData, null, 2),
            report: context.report,
        })
        return changesetData
    }

    const serializedData = JSON.stringify(changesetData, null, 2)

    if (config.changesetFilename === '-') {
        console.log(serializedData)
    } else {
        const changesetPath = path.resolve(
            config.cwd,
            npath.fromPortablePath(config.changesetFilename),
        )
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
