import { Readable } from 'stream'

import { resolveConventionalConfig } from '@monodeploy/changelog'
import { readStream } from '@monodeploy/io'
import type {
    MonodeployConfiguration,
    PackageStrategyType,
    StrategyDeterminer,
} from '@monodeploy/types'
import conventionalCommitsParser, { Commit } from 'conventional-commits-parser'

export const STRATEGY = {
    MAJOR: 0,
    MINOR: 1,
    PATCH: 2,
    NONE: 3,
}

export const getDefaultRecommendedStrategy: StrategyDeterminer = async (
    commits: string[],
): Promise<number> => {
    const commitsStream = Readable.from(commits).pipe(conventionalCommitsParser())
    const conventionalCommits = await readStream<Commit>(commitsStream)
    const titlePattern = new RegExp('^(\\w+)(\\([^)]+\\))?$', 'g')
    const PATCH_TYPES = ['fix', 'perf']
    const FEATURE_TYPES = ['feat']
    const BREAKING_CHANGE = 'breaking change'
    return conventionalCommits.reduce((level, commit) => {
        for (const note of commit.notes) {
            if (note.title.toLowerCase().includes(BREAKING_CHANGE)) {
                return STRATEGY.MAJOR
            }

            const matches = [...note.title.matchAll(titlePattern)]?.[0]
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

        if (commit.revert) {
            return Math.min(level, STRATEGY.PATCH)
        }
        return level
    }, STRATEGY.NONE)
}

export const createGetConventionalRecommendedStrategy =
    (config: MonodeployConfiguration): StrategyDeterminer =>
    async (commits: string[]): Promise<number> => {
        const conventionalChangelogConfig = config.conventionalChangelogConfig

        if (!conventionalChangelogConfig) {
            throw new Error('Invalid conventional changelog config')
        }

        const conventionalConfig = await resolveConventionalConfig({ config })

        const commitsStream = Readable.from(commits).pipe(
            conventionalCommitsParser(conventionalConfig.parserOpts),
        )
        const conventionalCommits = await readStream<Commit>(commitsStream)

        const conventionalStrategy = await conventionalConfig.recommendedBumpOpts.whatBump(
            conventionalCommits,
        )

        return conventionalStrategy?.level ?? STRATEGY.NONE
    }

export const maxStrategy = (
    strategyA?: PackageStrategyType,
    strategyB?: PackageStrategyType,
): PackageStrategyType => {
    if (!strategyA && !strategyB) throw new Error('Invalid strategies.')
    if (!strategyA) return strategyB as PackageStrategyType
    if (!strategyB) return strategyA as PackageStrategyType

    if (strategyA === 'major' || strategyB === 'major') {
        return 'major'
    }
    if (strategyA === 'minor' || strategyB === 'minor') {
        return 'minor'
    }
    return 'patch'
}
