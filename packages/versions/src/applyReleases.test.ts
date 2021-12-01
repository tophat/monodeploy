import path from 'path'

import { getMonodeployConfig, withMonorepoContext } from '@monodeploy/test-utils'
import { MonodeployConfiguration, PackageStrategyType, YarnContext } from '@monodeploy/types'
import { Manifest, Workspace, structUtils } from '@yarnpkg/core'
import { npath } from '@yarnpkg/fslib'

import applyReleases, { incrementVersion } from './applyReleases'

const identToWorkspace = (context: YarnContext, name: string): Workspace =>
    context.project.getWorkspaceByIdent(structUtils.parseIdent(name))

const loadManifest = async (context: YarnContext, pkgName: string): Promise<Manifest> => {
    return await Manifest.fromFile(
        npath.toPortablePath(path.join(context.project.cwd, 'packages', pkgName, 'package.json')),
    )
}

describe('applyReleases', () => {
    it("rewrites dependency versions in package.jsons, including dependencies we're not updating", async () =>
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
                const workspace1 = identToWorkspace(context, 'pkg-1')
                const workspace2 = identToWorkspace(context, 'pkg-2')
                const workspace3 = identToWorkspace(context, 'pkg-3')

                const { next: intendedVersions } = await applyReleases({
                    config,
                    context,
                    workspaces: new Set([workspace2, workspace3]),
                    registryTags: new Map([
                        ['pkg-1', { latest: '1.0.0' }],
                        ['pkg-2', { latest: '2.0.0' }],
                        ['pkg-3', { latest: '3.3.0' }],
                    ]),
                    versionStrategies: new Map([
                        ['pkg-2', { type: 'minor', commits: [] }],
                        ['pkg-3', { type: 'patch', commits: [] }],
                    ]),
                })

                expect(intendedVersions.has('pkg-1')).toBeFalsy()
                expect(intendedVersions.get('pkg-2')).toBe('2.1.0')
                expect(intendedVersions.get('pkg-3')).toBe('3.3.1')

                const manifest1 = await loadManifest(context, 'pkg-1')
                const manifest2 = await loadManifest(context, 'pkg-2')
                const manifest3 = await loadManifest(context, 'pkg-3')

                // pkg-1 wasn't included in the workspaces set, so shouldn't be updated
                expect(manifest1.version).toBe('0.0.0')
                expect(manifest2.version).toBe('2.1.0')
                expect(manifest3.version).toBe('3.3.1')

                // pkg-1 should be unchanged from registry tags
                expect(manifest2.dependencies.get(workspace1.manifest.name!.identHash)!.range).toBe(
                    'workspace:^1.0.0',
                )

                // pkg-2 should be the "new" version
                expect(
                    manifest3.peerDependencies.get(workspace2.manifest.name!.identHash)!.range,
                ).toBe('workspace:^2.1.0')

                // pkg-1 again should not be changed from registry tags
                expect(manifest3.dependencies.get(workspace1.manifest.name!.identHash)!.range).toBe(
                    'workspace:^1.0.0',
                )
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
                const workspace1 = identToWorkspace(context, 'pkg-1')
                const workspace2 = identToWorkspace(context, 'pkg-2')
                const workspace3 = identToWorkspace(context, 'pkg-3')

                const { next: intendedVersions } = await applyReleases({
                    config,
                    context,
                    workspaces: new Set([workspace1, workspace2, workspace3]),
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
                })

                expect(intendedVersions.get('pkg-1')).toBe('1.1.0-rc.0')
                expect(intendedVersions.get('pkg-2')).toBe('2.1.0-rc.4')
                expect(intendedVersions.get('pkg-3')).toBe('4.0.0-rc.2')

                const manifest1 = await loadManifest(context, 'pkg-1')
                const manifest2 = await loadManifest(context, 'pkg-2')
                const manifest3 = await loadManifest(context, 'pkg-3')

                expect(manifest1.version).toBe('1.1.0-rc.0')
                expect(manifest2.version).toBe('2.1.0-rc.4')
                expect(manifest3.version).toBe('4.0.0-rc.2')
            },
        ))

    it('patches non-updated versions correctly in prerelease mode', async () =>
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
                const workspace1 = identToWorkspace(context, 'pkg-1')
                const workspace2 = identToWorkspace(context, 'pkg-2')
                const workspace3 = identToWorkspace(context, 'pkg-3')
                const workspace4 = identToWorkspace(context, 'pkg-4')

                const { next: intendedVersions } = await applyReleases({
                    config,
                    context,
                    workspaces: new Set([workspace1, workspace2, workspace3]),
                    registryTags: new Map([
                        ['pkg-1', { latest: '1.0.0' }],
                        ['pkg-2', { latest: '1.2.0', next: '0.5.0-rc.1' }],
                        ['pkg-3', { latest: '3.3.0', next: '4.0.0-rc.1' }],
                        ['pkg-4', { latest: '0.1.0' }],
                    ]),
                    versionStrategies: new Map([['pkg-1', { type: 'minor', commits: [] }]]),
                })
                expect(intendedVersions.get('pkg-1')).toBe('1.1.0-rc.0')

                const manifest1 = await loadManifest(context, 'pkg-1')
                expect(manifest1.version).toBe('1.1.0-rc.0')

                // Use the greaatest version out of latest & prerelease for non-updated packages
                expect(manifest1.dependencies.get(workspace2.manifest.name!.identHash)!.range).toBe(
                    'workspace:^1.2.0',
                )
                expect(manifest1.dependencies.get(workspace3.manifest.name!.identHash)!.range).toBe(
                    'workspace:^4.0.0-rc.1',
                )
                expect(manifest1.dependencies.get(workspace4.manifest.name!.identHash)!.range).toBe(
                    'workspace:^0.1.0',
                )
            },
        ))
})

describe('applyReleases prereleases', () => {
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
