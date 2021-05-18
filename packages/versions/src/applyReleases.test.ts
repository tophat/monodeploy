import path from 'path'

import { Manifest, Workspace, structUtils } from '@yarnpkg/core'
import { npath } from '@yarnpkg/fslib'

import {
    getMonodeployConfig,
    withMonorepoContext,
} from '@monodeploy/test-utils'
import { YarnContext } from '@monodeploy/types'

import applyReleases from './applyReleases'

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

describe('applyReleases', () => {
    it(`rewrites dependency versions in package.jsons, including dependencies we're not updating`, async () =>
        withMonorepoContext(
            {
                'pkg-1': {},
                'pkg-2': { dependencies: ['pkg-1'] },
                'pkg-3': {
                    peerDependencies: ['pkg-2'],
                    devDependencies: ['pkg-1'],
                },
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

                const intendedVersions = await applyReleases(
                    config,
                    context,
                    new Set([workspace2, workspace3]),
                    new Map([
                        ['pkg-1', '1.0.0'],
                        ['pkg-2', '2.0.0'],
                        ['pkg-3', '3.3.0'],
                    ]),
                    new Map([
                        ['pkg-2', { type: 'minor', commits: [] }],
                        ['pkg-3', { type: 'patch', commits: [] }],
                    ]),
                )

                expect(intendedVersions.has('pkg-1')).toBeFalsy()
                expect(intendedVersions.get('pkg-2')).toEqual('2.1.0')
                expect(intendedVersions.get('pkg-3')).toEqual('3.3.1')

                const manifest1 = await loadManifest(context, 'pkg-1')
                const manifest2 = await loadManifest(context, 'pkg-2')
                const manifest3 = await loadManifest(context, 'pkg-3')

                // pkg-1 wasn't included in the workspaces set, so shouldn't be updated
                expect(manifest1.version).toEqual('0.0.0')
                expect(manifest2.version).toEqual('2.1.0')
                expect(manifest3.version).toEqual('3.3.1')

                // pkg-1 should be unchanged from registry tags
                expect(
                    manifest2.dependencies.get(
                        workspace1.manifest.name!.identHash,
                    )!.range,
                ).toEqual(`^1.0.0`)

                // pkg-2 should be the "new" version
                expect(
                    manifest3.peerDependencies.get(
                        workspace2.manifest.name!.identHash,
                    )!.range,
                ).toEqual(`^2.1.0`)

                // pkg-1 again should not be changed from registry tags
                expect(
                    manifest3.devDependencies.get(
                        workspace1.manifest.name!.identHash,
                    )!.range,
                ).toEqual(`^1.0.0`)
            },
        ))
})
