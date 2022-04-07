import { getMonodeployConfig, withMonorepoContext } from '@monodeploy/test-utils'
import { MonodeployConfiguration, PackageStrategyType } from '@monodeploy/types'

import applyVersionStrategies, { incrementVersion } from './applyVersionStrategies'

describe('applyVersionStrategies', () => {
    it("includes dependencies we're not updating in previous tags", async () =>
        withMonorepoContext(
            {
                'pkg-1': {},
                'pkg-2': { dependencies: ['pkg-1'] },
                'pkg-3': {
                    peerDependencies: ['pkg-2'],
                    dependencies: ['pkg-1'],
                },
            },
            async (context) => {
                const config = {
                    ...(await getMonodeployConfig({
                        cwd: context.project.cwd,
                        baseBranch: 'main',
                        commitSha: 'shashasha',
                    })),
                    persistVersions: true,
                }
                const { next: intendedVersions, previous } = await applyVersionStrategies({
                    config,
                    context,
                    registryTags: new Map([
                        ['pkg-1', { latest: '1.0.0' }],
                        ['pkg-2', { latest: '2.0.0' }],
                        ['pkg-3', { latest: '3.3.0' }],
                    ]),
                    versionStrategies: new Map([
                        ['pkg-2', { type: 'minor', commits: [] }],
                        ['pkg-3', { type: 'patch', commits: [] }],
                    ]),
                    workspaceGroups: new Map([
                        ['pkg-1', new Set(['pkg-1'])],
                        ['pkg-2', new Set(['pkg-2'])],
                        ['pkg-3', new Set(['pkg-3'])],
                    ]),
                })

                expect(intendedVersions.has('pkg-1')).toBeFalsy()
                expect(intendedVersions.get('pkg-2')).toBe('2.1.0')
                expect(intendedVersions.get('pkg-3')).toBe('3.3.1')

                // pkg-1 wasn't included in the workspaces set, so shouldn't be updated
                expect(previous.get('pkg-1')).toBe('1.0.0')
            },
        ))

    it('applies a prerelease version in prerelease mode', async () =>
        withMonorepoContext(
            {
                'pkg-1': {},
                'pkg-2': { dependencies: ['pkg-1'] },
                'pkg-3': {
                    peerDependencies: ['pkg-2'],
                    dependencies: ['pkg-1'],
                },
            },
            async (context) => {
                const config: MonodeployConfiguration = {
                    ...(await getMonodeployConfig({
                        cwd: context.project.cwd,
                        baseBranch: 'main',
                        commitSha: 'shashasha',
                    })),
                    persistVersions: true,
                    prerelease: true,
                    prereleaseNPMTag: 'next',
                    prereleaseId: 'rc',
                }
                const { next: intendedVersions } = await applyVersionStrategies({
                    config,
                    context,
                    registryTags: new Map([
                        ['pkg-1', { latest: '1.0.0' }],
                        ['pkg-2', { latest: '2.0.0', next: '2.1.0-rc.3' }],
                        ['pkg-3', { latest: '3.3.0', next: '4.0.0-rc.1' }],
                    ]),
                    versionStrategies: new Map([
                        ['pkg-1', { type: 'minor', commits: [] }],
                        ['pkg-2', { type: 'minor', commits: [] }],
                        ['pkg-3', { type: 'major', commits: [] }],
                    ]),
                    workspaceGroups: new Map([
                        ['pkg-1', new Set(['pkg-1'])],
                        ['pkg-2', new Set(['pkg-2'])],
                        ['pkg-3', new Set(['pkg-3'])],
                    ]),
                })

                expect(intendedVersions.get('pkg-1')).toBe('1.1.0-rc.0')
                expect(intendedVersions.get('pkg-2')).toBe('2.1.0-rc.4')
                expect(intendedVersions.get('pkg-3')).toBe('4.0.0-rc.2')
            },
        ))

    it('returns non-updated versions correctly in prerelease mode', async () =>
        withMonorepoContext(
            {
                'pkg-1': { dependencies: ['pkg-2', 'pkg-3', 'pkg-4'] },
                'pkg-2': {},
                'pkg-3': {},
                'pkg-4': {},
            },
            async (context) => {
                const config: MonodeployConfiguration = {
                    ...(await getMonodeployConfig({
                        cwd: context.project.cwd,
                        baseBranch: 'main',
                        commitSha: 'shashasha',
                    })),
                    persistVersions: true,
                    prerelease: true,
                    prereleaseNPMTag: 'next',
                    prereleaseId: 'rc',
                }

                const { next: intendedVersions, previous } = await applyVersionStrategies({
                    config,
                    context,
                    registryTags: new Map([
                        ['pkg-1', { latest: '1.0.0' }],
                        ['pkg-2', { latest: '1.2.0', next: '0.5.0-rc.1' }],
                        ['pkg-3', { latest: '3.3.0', next: '4.0.0-rc.1' }],
                        ['pkg-4', { latest: '0.1.0' }],
                    ]),
                    versionStrategies: new Map([['pkg-1', { type: 'minor', commits: [] }]]),
                    workspaceGroups: new Map([
                        ['pkg-1', new Set(['pkg-1'])],
                        ['pkg-2', new Set(['pkg-2'])],
                        ['pkg-3', new Set(['pkg-3'])],
                        ['pkg-4', new Set(['pkg-4'])],
                    ]),
                })
                expect(intendedVersions.get('pkg-1')).toBe('1.1.0-rc.0')

                // Use the greaatest version out of latest & prerelease for non-updated packages
                expect(previous.get('pkg-2')).toBe('1.2.0')
                expect(previous.get('pkg-3')).toBe('4.0.0-rc.1')
                expect(previous.get('pkg-4')).toBe('0.1.0')
            },
        ))

    describe('Groups', () => {
        // idiomatic version number: x.x.0 is always from a minor strategy, x.0.0 is always from a major strategy
        it('updates to the greatest version among each group, always resulting in an idiomatic version number', async () =>
            withMonorepoContext(
                {
                    'pkg-1': { raw: { group: 'group-a' } },
                    'pkg-2': { raw: { group: 'group-a' }, dependencies: ['pkg-1'] },
                    'pkg-3': {
                        raw: { group: 'group-b' },
                    },
                    'pkg-4': {
                        raw: { group: 'group-b' },
                    },
                },
                async (context) => {
                    const config = {
                        ...(await getMonodeployConfig({
                            cwd: context.project.cwd,
                            baseBranch: 'main',
                            commitSha: 'shashasha',
                        })),
                        persistVersions: true,
                    }

                    const { next: intendedVersions } = await applyVersionStrategies({
                        config,
                        context,
                        registryTags: new Map([
                            ['pkg-1', { latest: '6.0.0' }],
                            ['pkg-2', { latest: '2.0.0' }],
                            ['pkg-3', { latest: '3.3.0' }],
                            ['pkg-4', { latest: '5.1.0' }],
                        ]),
                        versionStrategies: new Map([
                            ['pkg-1', { type: 'patch', commits: [] }],
                            ['pkg-2', { type: 'minor', commits: [] }],
                            ['pkg-3', { type: 'patch', commits: [] }],
                            ['pkg-4', { type: 'patch', commits: [] }],
                        ]),
                        workspaceGroups: new Map([
                            ['group-a', new Set(['pkg-1', 'pkg-2'])],
                            ['group-b', new Set(['pkg-3', 'pkg-4'])],
                        ]),
                    })

                    // group-a
                    expect(intendedVersions.get('pkg-1')).toBe('6.1.0')
                    expect(intendedVersions.get('pkg-2')).toBe('6.1.0')

                    // group-b
                    expect(intendedVersions.get('pkg-3')).toBe('5.1.1')
                    expect(intendedVersions.get('pkg-4')).toBe('5.1.1')
                },
            ))

        it('updates to the greatest version among each group, ignoring unchanged packages', async () =>
            withMonorepoContext(
                {
                    'pkg-1': { raw: { group: 'group-a' } },
                    'pkg-2': { raw: { group: 'group-a' }, dependencies: ['pkg-1'] },
                    'pkg-3': {
                        raw: { group: 'group-b' },
                    },
                    'pkg-4': {
                        raw: { group: 'group-b' },
                    },
                },
                async (context) => {
                    const config = {
                        ...(await getMonodeployConfig({
                            cwd: context.project.cwd,
                            baseBranch: 'main',
                            commitSha: 'shashasha',
                        })),
                        persistVersions: true,
                    }
                    const { next: intendedVersions } = await applyVersionStrategies({
                        config,
                        context,
                        registryTags: new Map([
                            ['pkg-1', { latest: '1.5.0' }],
                            ['pkg-2', { latest: '2.0.0' }],
                            ['pkg-3', { latest: '3.3.0' }],
                            ['pkg-4', { latest: '5.1.0' }],
                        ]),
                        versionStrategies: new Map([
                            ['pkg-1', { type: 'patch', commits: [] }],
                            ['pkg-2', { type: 'minor', commits: [] }],
                            ['pkg-4', { type: 'patch', commits: [] }],
                        ]),
                        workspaceGroups: new Map([
                            ['group-a', new Set(['pkg-1', 'pkg-2'])],
                            ['group-b', new Set(['pkg-3', 'pkg-4'])],
                        ]),
                    })

                    // group-a
                    expect(intendedVersions.get('pkg-1')).toBe('2.1.0')
                    expect(intendedVersions.get('pkg-2')).toBe('2.1.0')

                    // group-b but with pkg-3 not changing because no strategy
                    expect(intendedVersions.has('pkg-3')).toBeFalsy()
                    expect(intendedVersions.get('pkg-4')).toBe('5.1.1')
                },
            ))

        it('uses the largest group version as the base version when applying the update strategy', async () =>
            withMonorepoContext(
                {
                    'pkg-a1': { raw: { group: 'group-a' } },
                    'pkg-a2': { raw: { group: 'group-a' } },
                    'pkg-b1': { raw: { group: 'group-b' } },
                    'pkg-b2': { raw: { group: 'group-b' } },
                },
                async (context) => {
                    const config = {
                        ...(await getMonodeployConfig({
                            cwd: context.project.cwd,
                            baseBranch: 'main',
                            commitSha: 'shashasha',
                        })),
                        persistVersions: true,
                    }
                    const { next: intendedVersions } = await applyVersionStrategies({
                        config,
                        context,
                        registryTags: new Map([
                            ['pkg-a1', { latest: '1.5.0' }],
                            ['pkg-a2', { latest: '2.0.0' }],
                            ['pkg-b1', { latest: '3.3.0' }],
                            ['pkg-b2', { latest: '5.1.0' }],
                        ]),
                        versionStrategies: new Map([['pkg-a1', { type: 'minor', commits: [] }]]),
                        workspaceGroups: new Map([
                            ['group-a', new Set(['pkg-a1', 'pkg-a2'])],
                            ['group-b', new Set(['pkg-b1', 'pkg-b2'])],
                        ]),
                    })

                    // pkg-a1 applies "minor" to 2.0.0, not 1.5.0, since 2.0.0 is the greatest base version
                    // across the entire group 'a'.
                    expect(intendedVersions.get('pkg-a1')).toBe('2.1.0')

                    // no dependencies between the remaining packages, so they don't get updated
                    expect(intendedVersions.get('pkg-a2')).toBeFalsy()
                    expect(intendedVersions.has('pkg-b1')).toBeFalsy()
                    expect(intendedVersions.get('pkg-b2')).toBeFalsy()
                },
            ))
    })
})

describe('applyVersionStrategies prereleases', () => {
    it.each([
        // Applying "patch" to a "prepatch" gives us a "prepatch"
        ['2.0.1-rc.0', 'patch', '2.0.1-rc.1'],
        // Applying "minor" to a "prepatch" gives us a "preminor"
        ['2.0.1-rc.0', 'minor', '2.1.0-rc.0'],
        // Applying "major" to a "prepatch" gives us a "premajor"
        ['2.0.1-rc.0', 'major', '3.0.0-rc.0'],

        // Applying "patch" to a "preminor" gives us a "preminor"
        ['2.1.0-rc.0', 'patch', '2.1.0-rc.1'],
        // Applying "minor" to a "preminor" gives us a "preminor"
        ['2.1.0-rc.0', 'minor', '2.1.0-rc.1'],
        // Applying "major" to a "preminor" gives us a "premajor"
        ['2.1.0-rc.0', 'major', '3.0.0-rc.0'],

        // Applying "patch" to a "premajor" gives us a "premajor"
        ['2.0.0-rc.0', 'patch', '2.0.0-rc.1'],
        // Applying "minor" to a "premajor" gives us a "premajor"
        ['2.0.0-rc.0', 'minor', '2.0.0-rc.1'],
        // Applying "major" to a "premajor" gives us a "premajor"
        ['2.0.0-rc.0', 'major', '2.0.0-rc.1'],

        // Applying "S" to a "pre<S>" gives us a "pre<S>"
        ['2.0.3-rc.4', 'patch', '2.0.3-rc.5'],
        ['2.7.0-rc.6', 'minor', '2.7.0-rc.7'],
        ['2.0.0-rc.9', 'major', '2.0.0-rc.10'],
    ])('bumps pre-release %s with %s to %s', (fromVersion, strategy, toVersion) => {
        const { next: actualVersion } = incrementVersion({
            currentLatestVersion: '1.0.0',
            currentPrereleaseVersion: fromVersion,
            strategy: strategy as PackageStrategyType,
            prerelease: true,
            prereleaseId: 'rc',
        })
        expect(actualVersion).toEqual(toVersion)
    })

    it.each([
        // Applying "patch" to a "patch" gives us a "prepatch"
        ['2.0.1', 'patch', '2.0.2-rc.0'],
        // Applying "minor" to a "patch" gives us a "preminor"
        ['2.0.1', 'minor', '2.1.0-rc.0'],
        // Applying "major" to a "patch" gives us a "premajor"
        ['2.0.1', 'major', '3.0.0-rc.0'],

        // Applying "patch" to a "minor" gives us a "prepatch"
        ['2.1.0', 'patch', '2.1.1-rc.0'],
        // Applying "minor" to a "minor" gives us a "preminor"
        ['2.1.0', 'minor', '2.2.0-rc.0'],
        // Applying "major" to a "minor" gives us a "premajor"
        ['2.1.0', 'major', '3.0.0-rc.0'],

        // Applying "patch" to a "major" gives us a "prepatch"
        ['2.0.0', 'patch', '2.0.1-rc.0'],
        // Applying "minor" to a "major" gives us a "preminor"
        ['2.0.0', 'minor', '2.1.0-rc.0'],
        // Applying "major" to a "major" gives us a "premajor"
        ['2.0.0', 'major', '3.0.0-rc.0'],

        // Applying a "patch" to "unpublished" gives us a "prepatch"
        ['0.0.0', 'patch', '0.0.1-rc.0'],
        // Applying a "minor" to "unpublished" gives us a "preminor"
        ['0.0.0', 'minor', '0.1.0-rc.0'],
        // Applying a "major" to "unpublished" gives us a "premajor"
        ['0.0.0', 'major', '1.0.0-rc.0'],
    ])('bumps %s with %s to %s', (fromVersion, strategy, toVersion) => {
        const { previous, next: actualVersion } = incrementVersion({
            currentLatestVersion: fromVersion,
            currentPrereleaseVersion: null,
            strategy: strategy as PackageStrategyType,
            prerelease: true,
            prereleaseId: 'rc',
        })
        expect(actualVersion).toEqual(toVersion)
        expect(previous).toEqual(fromVersion)
    })

    it.each([
        ['2.6.3', '2.0.1-rc.4', 'patch', '2.6.4-rc.0'],
        ['2.6.3', '2.2.0-rc.2', 'minor', '2.7.0-rc.0'],
        ['3.0.0', '3.0.0-rc.0', 'major', '4.0.0-rc.0'],
    ])(
        'handles outdated prerelease with latest %s, prerelease %s, strategy %s',
        (fromLatest, fromPrerelease, strategy, toVersion) => {
            const { previous, next: actualVersion } = incrementVersion({
                currentLatestVersion: fromLatest,
                currentPrereleaseVersion: fromPrerelease,
                strategy: strategy as PackageStrategyType,
                prerelease: true,
                prereleaseId: 'rc',
            })
            expect(actualVersion).toEqual(toVersion)
            expect(previous).toEqual(fromLatest)
        },
    )
})
