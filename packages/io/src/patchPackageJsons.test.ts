import path from 'path'

import { getMonodeployConfig, withMonorepoContext } from '@monodeploy/test-utils'
import { YarnContext } from '@monodeploy/types'
import { Manifest, Workspace, structUtils } from '@yarnpkg/core'
import { npath } from '@yarnpkg/fslib'

import { patchPackageJsons } from '.'

const identToWorkspace = (context: YarnContext, name: string): Workspace =>
    context.project.getWorkspaceByIdent(structUtils.parseIdent(name))

const loadManifest = async (context: YarnContext, pkgName: string): Promise<Manifest> => {
    return await Manifest.fromFile(
        npath.toPortablePath(path.join(context.project.cwd, 'packages', pkgName, 'package.json')),
    )
}

describe('Patch Package Manifests', () => {
    it('updates root version and dependencies from registry tags', async () =>
        withMonorepoContext(
            {
                'pkg-1': {
                    dependencies: ['pkg-2'],
                    peerDependencies: ['pkg-3'],
                },
                'pkg-2': { dependencies: ['pkg-3'] },
                'pkg-3': {},
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

                await patchPackageJsons({
                    config,
                    context,
                    workspaces: new Set([workspace1, workspace2, workspace3]),
                    registryTags: new Map([
                        ['pkg-1', '1.0.0'],
                        ['pkg-2', '2.0.0'],
                        ['pkg-3', '3.0.0'],
                    ]),
                })

                const manifest1 = await loadManifest(context, 'pkg-1')
                const manifest2 = await loadManifest(context, 'pkg-2')
                const manifest3 = await loadManifest(context, 'pkg-3')

                expect(manifest1.version).toBe('1.0.0')
                expect(manifest2.version).toBe('2.0.0')
                expect(manifest3.version).toBe('3.0.0')

                expect(manifest1.dependencies.get(manifest2.name!.identHash)!.range).toBe(
                    'workspace:^2.0.0',
                )
                expect(manifest1.peerDependencies.get(manifest3.name!.identHash)!.range).toBe(
                    'workspace:^3.0.0',
                )
                expect(manifest2.dependencies.get(manifest3.name!.identHash)!.range).toBe(
                    'workspace:^3.0.0',
                )
            },
        ))

    it('throws an error if workspace is missing a name', async () =>
        withMonorepoContext(
            {
                'pkg-1': {
                    dependencies: ['pkg-2'],
                    peerDependencies: ['pkg-3'],
                },
                'pkg-2': { dependencies: ['pkg-3'] },
                'pkg-3': {},
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

                await expect(async () =>
                    patchPackageJsons({
                        config,
                        context,
                        workspaces: new Set([workspace1, workspace2, workspace3]),
                        registryTags: new Map([
                            ['pkg-1', '1.0.0'],
                            ['pkg-3', '3.0.0'],
                        ]),
                    }),
                ).rejects.toThrow('missing a version')
            },
        ))

    it('skips dependencies it does not have a version for', async () =>
        withMonorepoContext(
            {
                'pkg-1': {
                    dependencies: ['pkg-2'],
                    peerDependencies: ['pkg-3'],
                },
                'pkg-2': { dependencies: ['pkg-3'] },
                'pkg-3': {},
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

                await patchPackageJsons({
                    config,
                    context,
                    workspaces: new Set([workspace1, workspace2]),
                    registryTags: new Map([
                        ['pkg-1', '1.0.0'],
                        ['pkg-2', '2.0.0'],
                    ]),
                })

                const manifest1 = await loadManifest(context, 'pkg-1')
                const manifest2 = await loadManifest(context, 'pkg-2')
                const manifest3 = await loadManifest(context, 'pkg-3')

                expect(manifest1.version).toBe('1.0.0')
                expect(manifest2.version).toBe('2.0.0')
                expect(manifest3.version).toBe('0.0.0')

                expect(manifest1.dependencies.get(manifest2.name!.identHash)!.range).toBe(
                    'workspace:^2.0.0',
                )
                expect(manifest1.peerDependencies.get(manifest3.name!.identHash)!.range).toBe(
                    'workspace:*',
                )
                expect(manifest2.dependencies.get(manifest3.name!.identHash)!.range).toBe(
                    'workspace:packages/pkg-3',
                )
            },
        ))

    it('does not update devDependencies', async () =>
        withMonorepoContext(
            {
                'pkg-1': {
                    devDependencies: ['pkg-2'],
                    peerDependencies: ['pkg-3'],
                },
                'pkg-2': { dependencies: ['pkg-3'] },
                'pkg-3': {},
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

                await patchPackageJsons({
                    config,
                    context,
                    workspaces: new Set([workspace1, workspace2]),
                    registryTags: new Map([
                        ['pkg-1', '1.0.0'],
                        ['pkg-2', '2.0.0'],
                    ]),
                })

                const manifest1 = await loadManifest(context, 'pkg-1')
                const manifest2 = await loadManifest(context, 'pkg-2')

                expect(manifest1.version).toBe('1.0.0')
                expect(manifest2.version).toBe('2.0.0')
                expect(
                    manifest1.devDependencies
                        .get(manifest2.name!.identHash)!
                        .range.startsWith('workspace:'),
                ).toBe(true)
            },
        ))

    it('only adds workspace protocol to disk, not in memory', async () =>
        withMonorepoContext(
            {
                'pkg-1': {
                    dependencies: ['pkg-2', ['pkg-3', '*']],
                },
                'pkg-2': { dependencies: ['pkg-3'] },
                'pkg-3': {},
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

                await patchPackageJsons({
                    config,
                    context,
                    workspaces: new Set([workspace1, workspace2, workspace3]),
                    registryTags: new Map([
                        ['pkg-1', '1.0.0'],
                        ['pkg-2', '2.0.0'],
                        ['pkg-3', '3.0.0'],
                    ]),
                })

                // In memory we don't have the workspace protocol
                expect(
                    workspace1.manifest.dependencies.get(workspace2.manifest.name!.identHash)!
                        .range,
                ).toBe('^2.0.0')

                // On disk we have workspace protocol
                const manifest1 = await loadManifest(context, 'pkg-1')
                const manifest2 = await loadManifest(context, 'pkg-2')
                const manifest3 = await loadManifest(context, 'pkg-3')

                // no workspace protocol as we define it using '*' in the package.json
                expect(manifest1.dependencies.get(manifest3.name!.identHash)!.range).toBe('^3.0.0')

                // preserves workspace protocol
                expect(manifest1.dependencies.get(manifest2.name!.identHash)!.range).toBe(
                    'workspace:^2.0.0',
                )
            },
        ))

    it('does not modify disk in dry run mode', async () =>
        withMonorepoContext(
            {
                'pkg-1': {
                    dependencies: ['pkg-2'],
                    peerDependencies: ['pkg-3'],
                },
                'pkg-2': { dependencies: ['pkg-3'] },
                'pkg-3': {},
            },
            async (context) => {
                const config = {
                    ...(await getMonodeployConfig({
                        cwd: context.project.cwd,
                        baseBranch: 'main',
                        commitSha: 'shashasha',
                    })),
                    persistVersions: true,
                    dryRun: true,
                }

                const workspace1 = identToWorkspace(context, 'pkg-1')
                const workspace2 = identToWorkspace(context, 'pkg-2')
                const workspace3 = identToWorkspace(context, 'pkg-3')

                await patchPackageJsons({
                    config,
                    context,
                    workspaces: new Set([workspace1, workspace2, workspace3]),
                    registryTags: new Map([
                        ['pkg-1', '1.0.0'],
                        ['pkg-2', '2.0.0'],
                        ['pkg-3', '3.0.0'],
                    ]),
                })

                const manifest1 = await loadManifest(context, 'pkg-1')
                const manifest2 = await loadManifest(context, 'pkg-2')
                const manifest3 = await loadManifest(context, 'pkg-3')

                expect(manifest1.version).not.toBe('1.0.0')
                expect(manifest2.version).not.toBe('2.0.0')
                expect(manifest3.version).not.toBe('3.0.0')

                expect(workspace1.manifest.version).toBe('1.0.0')
                expect(workspace2.manifest.version).toBe('2.0.0')
                expect(workspace3.manifest.version).toBe('3.0.0')
            },
        ))
})
