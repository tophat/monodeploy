import { getMonodeployConfig, withMonorepoContext } from '@monodeploy/test-utils'
import { RegistryMode } from '@monodeploy/types'

import { getFetchRegistryUrl } from './getRegistryUrl'

describe('getFetchRegistryUrl', () => {
    it('returns null if in no registry mode', async () =>
        withMonorepoContext(
            {
                'pkg-1': {},
            },
            async (context) => {
                const config = await getMonodeployConfig({
                    commitSha: 'shashasha',
                    baseBranch: 'main',
                    noRegistry: true,
                    registryUrl: 'http://example.com',
                })
                const url = await getFetchRegistryUrl({
                    config,
                    context,
                    workspace: context.workspace,
                })
                expect(url).toBeNull()
            },
        ))

    it('returns null if registry mode set to manifest', async () =>
        withMonorepoContext(
            {
                'pkg-1': {},
            },
            async (context) => {
                const config = await getMonodeployConfig({
                    commitSha: 'shashasha',
                    baseBranch: 'main',
                    registryMode: RegistryMode.Manifest,
                    registryUrl: 'http://example.com',
                })
                const url = await getFetchRegistryUrl({
                    config,
                    context,
                    workspace: context.workspace,
                })
                expect(url).toBeNull()
            },
        ))

    it('returns null if registry mode is overridden for the workspace and set to manifest', async () =>
        withMonorepoContext(
            {
                'pkg-1': {},
            },
            async (context) => {
                const config = await getMonodeployConfig({
                    commitSha: 'shashasha',
                    baseBranch: 'main',
                    registryMode: RegistryMode.NPM,
                    registryUrl: 'http://example.com',
                    packageGroups: {
                        [context.workspace.manifest.raw.name]: {
                            registryMode: RegistryMode.Manifest,
                        },
                    },
                })

                const url = await getFetchRegistryUrl({
                    config,
                    context,
                    workspace: context.workspace,
                })
                expect(url).toBeNull()
            },
        ))

    it('returns url if registry mode is overridden for the workspace and set to npm', async () =>
        withMonorepoContext(
            {
                'pkg-1': {},
            },
            async (context) => {
                const config = await getMonodeployConfig({
                    commitSha: 'shashasha',
                    baseBranch: 'main',
                    registryMode: RegistryMode.Manifest,
                    registryUrl: 'http://example.com',
                    packageGroups: {
                        [context.workspace.manifest.raw.name]: {
                            registryMode: RegistryMode.NPM,
                        },
                    },
                })

                const url = await getFetchRegistryUrl({
                    config,
                    context,
                    workspace: context.workspace,
                })
                expect(url).toEqual(config.registryUrl)
            },
        ))

    it("overrides project's registry url with config option", async () =>
        withMonorepoContext(
            {
                'pkg-1': {},
            },
            async (context) => {
                const config = await getMonodeployConfig({
                    commitSha: 'shashasha',
                    baseBranch: 'main',
                    registryUrl: 'http://example.com',
                })
                const url = await getFetchRegistryUrl({
                    config,
                    context,
                    workspace: context.workspace,
                })
                expect(url).toEqual(config.registryUrl)
            },
        ))

    it('defaults to yarn config if no registry provided', async () =>
        withMonorepoContext(
            {
                'pkg-1': {},
            },
            async (context) => {
                const config = await getMonodeployConfig({
                    commitSha: 'shashasha',
                    baseBranch: 'main',
                    registryUrl: undefined,
                })
                const url = await getFetchRegistryUrl({
                    config,
                    context,
                    workspace: context.workspace,
                })
                expect(url).toMatchInlineSnapshot('"https://registry.yarnpkg.com"')
            },
        ))
})
