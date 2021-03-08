import {
    getMonodeployConfig,
    withMonorepoContext,
} from '@monodeploy/test-utils'

import getRegistryUrl from './getRegistryUrl'

describe('getRegistryUrl', () => {
    it(`overrides project's registry url with config option`, async () =>
        withMonorepoContext(
            {
                'pkg-1': {},
            },
            async context => {
                const config = await getMonodeployConfig({
                    commitSha: 'shashasha',
                    baseBranch: 'master',
                })
                config.registryUrl = 'http://example.com'
                const url = await getRegistryUrl(config, context)
                expect(url).toEqual(config.registryUrl)
            },
        ))
})
