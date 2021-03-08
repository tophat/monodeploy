import { structUtils } from '@yarnpkg/core'

import { withMonorepoContext } from '@monodeploy/test-utils'

import { parseRepositoryProperty } from './changelog'

describe('parseRepositoryProperty', () => {
    it('parses repository from manifest url', async () =>
        withMonorepoContext({ 'pkg-1': {} }, async context => {
            const workspace = context.project.getWorkspaceByIdent(
                structUtils.parseIdent('pkg-1'),
            )

            workspace.manifest.setRawField(
                'repository',
                'git@github.com:tophat/monodeploy.git',
            )
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
                'https://github.com/tophat/monodeploy.git',
            )
            expect(await parseRepositoryProperty(workspace)).toEqual(
                expect.objectContaining({
                    host: 'https://github.com',
                    owner: 'tophat',
                    repository: 'monodeploy',
                    repoUrl: 'https://github.com/tophat/monodeploy.git',
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
                    repoUrl: 'git+https://github.com/tophat/monodeploy.git',
                }),
            )
        }))
})
