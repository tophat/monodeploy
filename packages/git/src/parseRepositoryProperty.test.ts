import { withMonorepoContext } from '@monodeploy/test-utils'
import { structUtils } from '@yarnpkg/core'

import { parseRepositoryProperty } from './parseRepositoryProperty'

describe('parseRepositoryProperty', () => {
    it('parses repository from manifest url as string', async () =>
        withMonorepoContext({ 'pkg-1': {} }, async (context) => {
            const workspace = context.project.getWorkspaceByIdent(structUtils.parseIdent('pkg-1'))

            workspace.manifest.setRawField('repository', 'git@github.com:tophat/monodeploy.git')
            expect(await parseRepositoryProperty(workspace)).toEqual(
                expect.objectContaining({
                    host: 'https://github.com',
                    owner: 'tophat',
                    repository: 'monodeploy',
                    repoUrl: 'https://github.com/tophat/monodeploy',
                }),
            )

            workspace.manifest.setRawField('repository', 'https://github.com/tophat/monodeploy.git')
            expect(await parseRepositoryProperty(workspace)).toEqual(
                expect.objectContaining({
                    host: 'https://github.com',
                    owner: 'tophat',
                    repository: 'monodeploy',
                    repoUrl: 'https://github.com/tophat/monodeploy',
                }),
            )

            workspace.manifest.setRawField(
                'repository',
                'git+https://github.com/tophat/monodeploy.git',
            )
            expect(await parseRepositoryProperty(workspace)).toEqual(
                expect.objectContaining({
                    host: 'https://github.com',
                    owner: 'tophat',
                    repository: 'monodeploy',
                    repoUrl: 'git+https://github.com/tophat/monodeploy',
                }),
            )
        }))

    it('parses repository from manifest url as object', async () =>
        withMonorepoContext({ 'pkg-1': {} }, async (context) => {
            const workspace = context.project.getWorkspaceByIdent(structUtils.parseIdent('pkg-1'))

            workspace.manifest.setRawField('repository', {
                type: 'git',
                url: 'https://github.com/tophat/monodeploy.git',
                directory: 'packages/pkg-1',
            })
            expect(await parseRepositoryProperty(workspace)).toEqual(
                expect.objectContaining({
                    host: 'https://github.com',
                    owner: 'tophat',
                    repository: 'monodeploy',
                    repoUrl: 'https://github.com/tophat/monodeploy',
                }),
            )
        }))

    it('falls back to project root manifest', async () =>
        withMonorepoContext({ 'pkg-1': {} }, async (context) => {
            const workspace = context.project.getWorkspaceByIdent(structUtils.parseIdent('pkg-1'))
            workspace.project.topLevelWorkspace.manifest.setRawField(
                'repository',
                'git@github.com:tophat/monodeploy.git',
            )
            workspace.manifest.setRawField('repository', '')
            expect(await parseRepositoryProperty(workspace)).toEqual(
                expect.objectContaining({
                    host: 'https://github.com',
                    owner: 'tophat',
                    repository: 'monodeploy',
                    repoUrl: 'https://github.com/tophat/monodeploy',
                }),
            )
        }))

    it('does not fallback to project root manifest if fallback option disabled', async () =>
        withMonorepoContext({ 'pkg-1': {} }, async (context) => {
            const workspace = context.project.getWorkspaceByIdent(structUtils.parseIdent('pkg-1'))
            workspace.project.topLevelWorkspace.manifest.setRawField(
                'repository',
                'git@github.com:tophat/monodeploy.git',
            )
            workspace.manifest.setRawField('repository', '')
            expect(
                await parseRepositoryProperty(workspace, {
                    fallbackToTopLevel: false,
                }),
            ).toEqual(
                expect.objectContaining({
                    host: null,
                    owner: null,
                    repository: null,
                    repoUrl: null,
                }),
            )
        }))

    it('fails gracefully if falling back and root does not have repository', async () =>
        withMonorepoContext({ 'pkg-1': {} }, async (context) => {
            const workspace = context.project.getWorkspaceByIdent(structUtils.parseIdent('pkg-1'))
            workspace.project.topLevelWorkspace.manifest.setRawField('repository', '')
            workspace.manifest.setRawField('repository', '')
            expect(
                await parseRepositoryProperty(workspace, {
                    fallbackToTopLevel: true,
                }),
            ).toEqual(
                expect.objectContaining({
                    host: null,
                    owner: null,
                    repository: null,
                    repoUrl: null,
                }),
            )
        }))
})
