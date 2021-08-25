import type { MonodeployConfiguration } from '@monodeploy/types'
import type { Options as ConventionalCommitsWriterOptions } from 'conventional-changelog-writer'
import type {
    Commit,
    Options as ConventionalCommitsParserOptions,
} from 'conventional-commits-parser'

type ConventionalStrategy = { level?: number | null }

type ConventionalChangelogConfig = {
    parserOpts: ConventionalCommitsParserOptions
    writerOpts: ConventionalCommitsWriterOptions
    recommendedBumpOpts: {
        whatBump: (commits: Commit[]) => ConventionalStrategy
    }
}

const coerceConventionalConfig = (
    config: Exclude<MonodeployConfiguration['conventionalChangelogConfig'], undefined>,
): Exclude<MonodeployConfiguration['conventionalChangelogConfig'], string | undefined> => {
    if (typeof config === 'string') {
        return {
            name: config,
        }
    }
    return config
}

const resolveConventionalConfig = async ({
    config,
}: {
    config: MonodeployConfiguration
}): Promise<ConventionalChangelogConfig> => {
    const conventionalChangelogConfig = config.conventionalChangelogConfig

    if (!conventionalChangelogConfig) {
        throw new Error('No conventional changelog config provided')
    }

    const conventionalConfig = coerceConventionalConfig(conventionalChangelogConfig)

    // ghost-imports-ignore-next-line
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const conventionalConfigModule = require(require.resolve(conventionalConfig.name, {
        paths: [config.cwd],
    }))

    return await (typeof conventionalConfigModule === 'function'
        ? conventionalConfigModule(conventionalConfig)
        : conventionalConfigModule)
}

export default resolveConventionalConfig
