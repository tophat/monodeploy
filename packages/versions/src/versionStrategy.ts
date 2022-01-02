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
    const titlePattern = new RegExp('^(\\w+)(\\([^)]+\\))?$', 'g')
    const PATCH_TYPES = ['fix', 'perf']
    const FEATURE_TYPES = ['feat']
    const BREAKING_CHANGE = 'breaking change'

    const parser = conventionalCommitsParser({
        headerPattern: /^(\w*)(?:\((.*)\))?: (.*)$/,
        headerCorrespondence: ['type', 'scope', 'subject'],
        noteKeywords: [
            'BREAKING CHANGE',
            ...[...PATCH_TYPES, ...FEATURE_TYPES].map((prefix) => `${prefix}(?:\\(.*\\))?`),
        ],
        revertPattern: /^(revert:|Revert)\s([\s\S]*?)\s*This reverts commit (\w*)\./,
        revertCorrespondence: ['prefix', 'header', 'hash'],
    })
    const commitsStream = Readable.from(commits).pipe(parser)
    const conventionalCommits = await readStream<Commit>(commitsStream)

    return conventionalCommits.reduce((level, commit) => {
        for (const note of commit.notes) {
            if (note.title.toLowerCase().startsWith(BREAKING_CHANGE)) {
                return STRATEGY.MAJOR
            }

            const matches = [...note.title.matchAll(titlePattern)]?.[0]
            const type = matches?.[1]

            if (FEATURE_TYPES.includes(type)) {
                level = Math.min(level, STRATEGY.MINOR)
                continue
            }
            if (PATCH_TYPES.includes(type)) {
                level = Math.min(level, STRATEGY.PATCH)
                continue
            }
        }

        if (commit.header?.toLowerCase().startsWith(BREAKING_CHANGE)) {
            return STRATEGY.MAJOR
        }

        const commitType = commit.type
        if (commitType) {
            if (FEATURE_TYPES.includes(commitType)) {
                level = Math.min(level, STRATEGY.MINOR)
            } else if (PATCH_TYPES.includes(commitType)) {
                level = Math.min(level, STRATEGY.PATCH)
            }
        }

        if (commit.revert) {
            level = Math.min(level, STRATEGY.PATCH)
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
