import { promises as fs } from 'fs'
import path from 'path'

import logging from '@monodeploy/logging'
import type { ChangesetSchema, MonodeployConfiguration, YarnContext } from '@monodeploy/types'
import { Workspace, structUtils } from '@yarnpkg/core'
import { npath } from '@yarnpkg/fslib'
import pLimit from 'p-limit'

const MARKER = '<!-- MONODEPLOY:BELOW -->'
const TOKEN_PACKAGE_DIR = '<packageDir>'

const prependEntry = async ({
    config,
    context,
    filename,
    entry,
}: {
    config: MonodeployConfiguration
    context: YarnContext
    filename: string
    entry: string
}): Promise<void> => {
    let changelogContents: string[] = []
    try {
        changelogContents = (await fs.readFile(filename, { encoding: 'utf-8' })).split('\n')
    } catch (err) {
        if (err.code === 'ENOENT') {
            logging.info(`[Changelog] Changelog ${filename} does not exist, creating.`, {
                report: context.report,
            })
            changelogContents = ['# Changelog', '', MARKER]
        } else {
            logging.error(`[Changelog] Unable to read changelog contents at ${filename}.`, {
                report: context.report,
            })
            throw err
        }
    }

    const changelogOffset = changelogContents.findIndex((value) => value.trim() === MARKER)
    if (changelogOffset === -1) {
        logging.error(`[Changelog] Missing changelog marker: '${MARKER}'`, {
            report: context.report,
        })
        throw new Error('Unable to prepend changelog.')
    }

    changelogContents.splice(changelogOffset + 1, 0, `\n${entry}\n`)

    const dataToWrite = changelogContents.join('\n')

    if (config.dryRun && !config.forceWriteChangeFiles) {
        logging.debug('[Changelog] Skipping changelog update.', {
            report: context.report,
        })
    } else {
        await fs.writeFile(filename, dataToWrite, {
            encoding: 'utf-8',
        })
    }

    logging.info(`[Changelog] Updated ${filename}`, {
        report: context.report,
    })
}

const prependChangelogFile = async ({
    config,
    context,
    changeset,
    workspaces,
}: {
    config: MonodeployConfiguration
    context: YarnContext
    changeset: ChangesetSchema
    workspaces: Set<Workspace>
}): Promise<void> => {
    if (!config.changelogFilename) return

    if (config.changelogFilename.includes(TOKEN_PACKAGE_DIR)) {
        const prependForWorkspace = async (workspace: Workspace): Promise<void> => {
            const filename = config.changelogFilename!.replace(
                TOKEN_PACKAGE_DIR,
                npath.fromPortablePath(workspace.cwd),
            )
            const packageName = structUtils.stringifyIdent(workspace.manifest.name!)
            const entry = changeset[packageName]?.changelog
            console.log(entry, packageName, changeset)
            if (entry) await prependEntry({ config, context, filename, entry })
        }

        const limit = pLimit(config.jobs || Infinity)
        await Promise.all(
            [...workspaces].map((workspace) => limit(() => prependForWorkspace(workspace))),
        )

        return
    }

    const filename = path.resolve(config.cwd, config.changelogFilename)

    const entry = Object.entries(changeset)
        .sort(([pkgNameA], [pkgNameB]) => pkgNameA.localeCompare(pkgNameB))
        .map(([, changesetValue]) => changesetValue.changelog)
        .filter((value) => value)
        .join('\n')
        .trim()

    if (entry) await prependEntry({ config, context, filename, entry })
}

export default prependChangelogFile
