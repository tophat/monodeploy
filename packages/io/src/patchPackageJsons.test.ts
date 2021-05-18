import path from 'path'

import { Manifest, Workspace, structUtils } from '@yarnpkg/core'
import { npath } from '@yarnpkg/fslib'

import {
    getMonodeployConfig,
    withMonorepoContext,
} from '@monodeploy/test-utils'
import { YarnContext } from '@monodeploy/types'

import { patchPackageJsons } from '.'

const identToWorkspace = (context: YarnContext, name: string): Workspace =>
    context.project.getWorkspaceByIdent(structUtils.parseIdent(name))

const loadManifest = async (
    context: YarnContext,
    pkgName: string,
): Promise<Manifest> => {
    return await Manifest.fromFile(
        npath.toPortablePath(
            path.join(context.project.cwd, 'packages', pkgName, 'package.json'),
        ),
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
            async context => {
                const config = await getMonodeployConfig({
                    cwd: context.project.cwd,
                    baseBranch: 'master',
                    commitSha: 'shashasha',
                })

                const workspace1 = identToWorkspace(context, 'pkg-1')
                const workspace2 = identToWorkspace(context, 'pkg-2')
                const workspace3 = identToWorkspace(context, 'pkg-3')

                await patchPackageJsons(
                    config,
                    context,
                    new Set([workspace1, workspace2, workspace3]),
                    new Map([
                        ['pkg-1', '1.0.0'],
                        ['pkg-2', '2.0.0'],
                        ['pkg-3', '3.0.0'],
                    ]),
                )

                const manifest1 = await loadManifest(context, 'pkg-1')
                const manifest2 = await loadManifest(context, 'pkg-2')
                const manifest3 = await loadManifest(context, 'pkg-3')

                expect(manifest1.version).toEqual('1.0.0')
                expect(manifest2.version).toEqual('2.0.0')
                expect(manifest3.version).toEqual('3.0.0')

                expect(
                    manifest1.dependencies.get(manifest2.name!.identHash)!
                        .range,
                ).toEqual(`^2.0.0`)
                expect(
                    manifest1.peerDependencies.get(manifest3.name!.identHash)!
                        .range,
                ).toEqual(`^3.0.0`)
                expect(
                    manifest2.dependencies.get(manifest3.name!.identHash)!
                        .range,
                ).toEqual(`^3.0.0`)
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
            async context => {
                const config = await getMonodeployConfig({
                    cwd: context.project.cwd,
                    baseBranch: 'master',
                    commitSha: 'shashasha',
                })

                const workspace1 = identToWorkspace(context, 'pkg-1')
                const workspace2 = identToWorkspace(context, 'pkg-2')
                const workspace3 = identToWorkspace(context, 'pkg-3')

                await expect(async () =>
                    patchPackageJsons(
                        config,
                        context,
                        new Set([workspace1, workspace2, workspace3]),
                        new Map([
                            ['pkg-1', '1.0.0'],
                            ['pkg-3', '3.0.0'],
                        ]),
                    ),
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
            async context => {
                const config = await getMonodeployConfig({
                    cwd: context.project.cwd,
                    baseBranch: 'master',
                    commitSha: 'shashasha',
                })

                const workspace1 = identToWorkspace(context, 'pkg-1')
                const workspace2 = identToWorkspace(context, 'pkg-2')

                await patchPackageJsons(
                    config,
                    context,
                    new Set([workspace1, workspace2]),
                    new Map([
                        ['pkg-1', '1.0.0'],
                        ['pkg-2', '2.0.0'],
                    ]),
                )

                const manifest1 = await loadManifest(context, 'pkg-1')
                const manifest2 = await loadManifest(context, 'pkg-2')
                const manifest3 = await loadManifest(context, 'pkg-3')

                expect(manifest1.version).toEqual('1.0.0')
                expect(manifest2.version).toEqual('2.0.0')
                expect(manifest3.version).toEqual('0.0.0')

                expect(
                    manifest1.dependencies.get(manifest2.name!.identHash)!
                        .range,
                ).toEqual(`^2.0.0`)
                expect(
                    manifest1.peerDependencies.get(manifest3.name!.identHash)!
                        .range,
                ).toEqual(`*`)
                expect(
                    manifest2.dependencies.get(manifest3.name!.identHash)!
                        .range,
                ).toEqual(`workspace:packages/pkg-3`)
            },
        ))
})
