import { createMonorepoContext, getMonodeployConfig } from '@monodeploy/test-utils'
import { RegistryMode } from '@monodeploy/types'

import { getPublishRegistryUrl } from './getPublishConfig'

describe('getPublishRegistryUrl', () => {
    it('returns null if registry mode set to manifest', async () => {
        await using context = await createMonorepoContext({
            'pkg-1': {},
        })
        const config = await getMonodeployConfig({
            commitSha: 'shashasha',
            baseBranch: 'main',
            registryMode: RegistryMode.Manifest,
            registryUrl: 'http://example.com',
        })
        const url = await getPublishRegistryUrl({
            config,
            context,
            workspace: context.workspace,
        })
        expect(url).toBeNull()
    })

    it('returns null if registry mode is overridden for the workspace and set to manifest', async () => {
        await using context = await createMonorepoContext({
            'pkg-1': {},
        })
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

        const url = await getPublishRegistryUrl({
            config,
            context,
            workspace: context.workspace,
        })
        expect(url).toBeNull()
    })

    it('returns url if registry mode is overridden for the workspace and set to npm', async () => {
        await using context = await createMonorepoContext({
            'pkg-1': {},
        })
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

        const url = await getPublishRegistryUrl({
            config,
            context,
            workspace: context.workspace,
        })
        expect(url).toEqual(config.registryUrl)
    })

    it("overrides project's registry url with config option", async () => {
        await using context = await createMonorepoContext({
            'pkg-1': {},
        })
        const config = await getMonodeployConfig({
            commitSha: 'shashasha',
            baseBranch: 'main',
            registryUrl: 'http://example.com',
        })
        const url = await getPublishRegistryUrl({
            config,
            context,
            workspace: context.workspace,
        })
        expect(url).toEqual(config.registryUrl)
    })

    it('defaults to yarn config if no registry provided', async () => {
        await using context = await createMonorepoContext({
            'pkg-1': {},
        })
        const config = await getMonodeployConfig({
            commitSha: 'shashasha',
            baseBranch: 'main',
            registryUrl: undefined,
        })
        const url = await getPublishRegistryUrl({
            config,
            context,
            workspace: context.workspace,
        })
        expect(url).toMatchInlineSnapshot('"https://registry.yarnpkg.com"')
    })
})
