import { ErrorsReported } from '@monodeploy/logging'
import monodeploy from '@monodeploy/node'
import { type MonodeployConfiguration, type RecursivePartial } from '@monodeploy/types'
import { Option } from 'clipanion'
import * as t from 'typanion'

import { BaseCommand } from './base'

export class MonodeployCommand extends BaseCommand {
    changesetFilename = Option.String('--changeset-filename', {
        validator: t.isString(),
        description: 'Changeset output filename',
    })

    applyChangeset = Option.Boolean('--apply-changeset', false, {
        description: 'Publishes using data from the changeset specified via --changeset-filename',
    })

    changelogFilename = Option.String('--changelog-filename', {
        validator: t.isString(),
        description: 'Changelog file to prepend changelog entries',
    })

    forceWriteChangeFiles = Option.Boolean('--force-write-change-files', {
        description:
            'Force changelog update and changeset writes even in dry run mode, good for previewing changes',
    })

    push = Option.Boolean('--push', { description: 'Whether to push git changes to remote' })

    persistVersions = Option.Boolean('--persist-versions', {
        description: 'Whether to persist package.json changes after publish',
    })

    access = Option.String('--access', {
        validator: t.isEnum(['infer', 'public', 'restricted'] as const),
        description:
            'Whether the package should be deployed as public or restricted (only applies to scoped packages)',
    })

    autoCommitMessage = Option.String('--auto-commit-message', {
        validator: t.isString(),
        description: 'Message to use when autocommiting the changelog and associated changes',
    })

    autoCommit = Option.Boolean('--auto-commit', {
        description:
            'Whether the changelog, package.json and lockfile changes should be autocommited to the active branch',
    })

    async execute(): Promise<number | void> {
        try {
            const { config: baseConfig, configFromFile } = await this.parseConfiguration()
            const config: RecursivePartial<MonodeployConfiguration> = {
                ...baseConfig,
                git: {
                    ...baseConfig.git,
                    push: this.push ?? configFromFile?.git?.push,
                },
                changesetFilename:
                    this.changesetFilename ?? configFromFile?.changesetFilename ?? undefined,
                applyChangeset: this.applyChangeset ?? undefined,
                changelogFilename:
                    this.changelogFilename ?? configFromFile?.changelogFilename ?? undefined,
                forceWriteChangeFiles:
                    this.forceWriteChangeFiles ?? configFromFile?.forceWriteChangeFiles,
                access: this.access ?? configFromFile?.access ?? undefined,
                persistVersions: this.persistVersions ?? configFromFile?.persistVersions,
                autoCommit: this.autoCommit ?? configFromFile?.autoCommit ?? undefined,
                autoCommitMessage:
                    this.autoCommitMessage ?? configFromFile?.autoCommitMessage ?? undefined,
            }

            await monodeploy(config)
            return 0
        } catch (err) {
            if (err instanceof ErrorsReported) {
                // We've already reported the error, return.
                return 1
            }

            this.context.stderr.write(`${err}\n`)
            if (process.env.DEBUG === 'monodeploy') {
                if (err instanceof Error) {
                    this.context.stderr.write(`${err.stack}\n`)
                }
            }
            return 1
        }
    }
}
