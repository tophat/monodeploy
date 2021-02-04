import path from 'path'

import { MonodeployConfiguration } from '../types'

import {
    STRATEGY,
    createGetConventionalRecommendedStrategy,
    getDefaultRecommendedStrategy,
} from './versionStrategy'

describe('Default Recommended Strategy', () => {
    it.each([
        [
            'Note Title w/ Feat',
            'feat: upgrade node\n\nBREAKING CHANGE: this is breaking',
        ],
        [
            'Note Title w/ Fix',
            'fix: this is a patch',
            'fix: another patch\n\nBREAKING CHANGE: oh no!',
        ],
        ['Type Prefix', 'BREAKING CHANGE: something changes'],
    ])('identifies breaking commits: %s', async (title, ...commits) => {
        expect(await getDefaultRecommendedStrategy(commits)).toEqual(
            STRATEGY.MAJOR,
        )
    })

    it('chooses major among minor and patch', async () => {
        const strategy = await getDefaultRecommendedStrategy([
            'chore: commit 1',
            'fix: this is a patch',
            'feat: upgrade node\n\nBREAKING CHANGE: this is breaking',
            'feat: this is a feature',
        ])
        expect(strategy).toEqual(STRATEGY.MAJOR)
    })

    it('chooses minor among patch', async () => {
        const strategy = await getDefaultRecommendedStrategy([
            'chore: commit 1',
            'fix: this is a patch',
            'feat: this is a feature',
        ])
        expect(strategy).toEqual(STRATEGY.MINOR)
    })

    it('chooses patch among none', async () => {
        const strategy = await getDefaultRecommendedStrategy([
            'chore: commit 1',
            'fix: this is a patch',
            'wip: this is a wip',
        ])
        expect(strategy).toEqual(STRATEGY.PATCH)
    })

    it('chooses none among none', async () => {
        const strategy = await getDefaultRecommendedStrategy([
            'chore: commit 1',
            'wip: this is a wip',
        ])
        expect(strategy).toEqual(STRATEGY.NONE)
    })
})

describe('Custom Conventional Recommended Strategy', () => {
    const monodeployConfig: MonodeployConfiguration = {
        cwd: process.cwd(),
        dryRun: false,
        git: {
            baseBranch: 'master',
            commitSha: 'HEAD',
            remote: 'origin',
            push: false,
        },
        conventionalChangelogConfig: path.resolve(
            path.join(__dirname, '..', 'mocks', 'conventional-config.mock.ts'),
        ),
        access: 'public',
    }

    afterEach(() => {
        // the mock config takes the value from an env variable
        delete process.env._TEST_VERSION_PIN_STRATEGY_LEVEL_
        delete process.env._TEST_VERSION_RETURN_NULL_
    })

    it('chooses none if strategy or level is not defined', async () => {
        const strategyDeterminer = createGetConventionalRecommendedStrategy(
            monodeployConfig,
        )

        process.env._TEST_VERSION_PIN_STRATEGY_LEVEL_ = ''
        expect(await strategyDeterminer(['feat: a feature!'])).toEqual(
            STRATEGY.NONE,
        )

        process.env._TEST_VERSION_RETURN_NULL_ = '1'
        process.env._TEST_VERSION_PIN_STRATEGY_LEVEL_ = String(STRATEGY.MINOR)
        expect(await strategyDeterminer(['feat: a feature!'])).toEqual(
            STRATEGY.NONE,
        )
    })

    it('chooses strategy based on custom config', async () => {
        const strategyDeterminer = createGetConventionalRecommendedStrategy(
            monodeployConfig,
        )

        process.env._TEST_VERSION_PIN_STRATEGY_LEVEL_ = String(STRATEGY.MINOR)
        expect(await strategyDeterminer(['feat: a feature!'])).toEqual(
            STRATEGY.MINOR,
        )

        process.env._TEST_VERSION_PIN_STRATEGY_LEVEL_ = String(STRATEGY.MAJOR)
        expect(await strategyDeterminer(['feat: a feature!!'])).toEqual(
            STRATEGY.MAJOR,
        )
    })
})
