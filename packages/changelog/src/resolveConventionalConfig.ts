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

const resolveConventionalConfig = async (
    config: MonodeployConfiguration,
): Promise<ConventionalChangelogConfig> => {
    if (!config.conventionalChangelogConfig) {
        throw new Error('No conventional changelog config provided')
    }

    const conventionalConfigName =
        typeof config.conventionalChangelogConfig === 'string'
            ? config.conventionalChangelogConfig
            : config.conventionalChangelogConfig.name
    const conventionalConfigConfig =
        typeof config.conventionalChangelogConfig === 'object'
            ? config.conventionalChangelogConfig
            : {}
    // ghost-imports-ignore-next-line
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const conventionalConfigModule = require(require.resolve(
        conventionalConfigName,
        { paths: [config.cwd] },
    ))

    return await (typeof conventionalConfigModule === 'function'
        ? conventionalConfigModule(conventionalConfigConfig)
        : conventionalConfigModule)
}

export default resolveConventionalConfig
