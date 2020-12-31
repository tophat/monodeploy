import { STRATEGY, getDefaultRecommendedStrategy } from './versionStrategy'

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
    it.todo('chooses none if strategy or level is not defined')
    it.todo('chooses strategy based on custom config')
})
