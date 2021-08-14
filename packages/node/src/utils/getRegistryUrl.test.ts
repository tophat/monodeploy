import { getMonodeployConfig, withMonorepoContext } from '@monodeploy/test-utils'

import { getFetchRegistryUrl } from './getRegistryUrl'

describe('getFetchRegistryUrl', () => {
    it('returns null if in no registry mode', async () =>
        withMonorepoContext(
            {
                'pkg-1': {},
            },
            async (context) => {
                const config = {
                    ...(await getMonodeployConfig({
                        commitSha: 'shashasha',
                        baseBranch: 'main',
                    })),
                    noRegistry: true,
                }
                config.registryUrl = 'http://example.com'
                const url = await getFetchRegistryUrl({ config, context })
                expect(url).toBeNull()
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
                })
                config.registryUrl = 'http://example.com'
                const url = await getFetchRegistryUrl({ config, context })
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
                })
                config.registryUrl = undefined
                const url = await getFetchRegistryUrl({ config, context })
                expect(url).toMatchInlineSnapshot('"https://registry.yarnpkg.com"')
            },
        ))
})
