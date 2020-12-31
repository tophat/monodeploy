import { Readable } from 'stream'

import conventionalCommitsParser, { Commit } from 'conventional-commits-parser'

import type { MonodeployConfiguration, StrategyDeterminer } from '../types'

import { readStream } from './stream'

export const STRATEGY = {
    MAJOR: 0,
    MINOR: 1,
    PATCH: 2,
    NONE: 3,
}

export const getDefaultRecommendedStrategy: StrategyDeterminer = async (
    commits: string[],
): Promise<number> => {
    const commitsStream = Readable.from(commits).pipe(
        conventionalCommitsParser(),
    )
    const conventionalCommits = await readStream<Commit>(commitsStream)
    const pattern = new RegExp('^(\\w+)(\\([^:]+\\))?:.*', 'g')
    const PATCH_TYPES = ['fix', 'perf']
    const FEATURE_TYPES = ['feat']
    const BREAKING_CHANGE = 'breaking change'
    return conventionalCommits.reduce((level, commit) => {
        for (const note of commit.notes) {
            if (note.title.toLowerCase().includes(BREAKING_CHANGE)) {
                return STRATEGY.MAJOR
            }

            const matches = [...note.title.matchAll(pattern)]?.[0]
            const type = matches?.[1]

            if (FEATURE_TYPES.includes(type)) {
                return Math.min(level, STRATEGY.MINOR)
            }
            if (PATCH_TYPES.includes(type)) {
                return Math.min(level, STRATEGY.PATCH)
            }
        }

        if (commit.header?.toLowerCase().includes(BREAKING_CHANGE)) {
            return STRATEGY.MAJOR
        }

        const commitType = commit.type
        if (commitType) {
            if (FEATURE_TYPES.includes(commitType)) {
                return Math.min(level, STRATEGY.MINOR)
            }
            if (PATCH_TYPES.includes(commitType)) {
                return Math.min(level, STRATEGY.PATCH)
            }
        }
        return level
    }, STRATEGY.NONE)
}

export const createGetConventionalRecommendedStrategy = (
    config: MonodeployConfiguration,
    conventionalChangelogConfigPath: string,
): StrategyDeterminer => async (commits: string[]): Promise<number> => {
    const conventionalConfig = await require(require.resolve(
        conventionalChangelogConfigPath,
        { paths: [config.cwd] },
    ))

    const commitsStream = Readable.from(commits).pipe(
        conventionalCommitsParser(conventionalConfig.parserOpts),
    )
    const conventionalCommits = await readStream<Commit>(commitsStream)

    const conventionalStrategy = await conventionalConfig.recommendedBumpOpts.whatBump(
        conventionalCommits,
    )

    return conventionalStrategy?.level ?? STRATEGY.NONE
}
