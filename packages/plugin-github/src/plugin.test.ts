import {
    getMonodeployConfig,
    withMonorepoContext,
} from '@monodeploy/test-utils'
import { PluginHooks } from '@monodeploy/types'
import { AsyncSeriesHook } from 'tapable'

import { PluginInternals } from './plugin'

import GitHubPlugin, { PluginName } from '.'

describe('GitHub Plugin', () => {
    it('registers on the onReleaseAvailable hook', async () => {
        const hooks: Pick<PluginHooks, 'onReleaseAvailable'> = {
            onReleaseAvailable: new AsyncSeriesHook(),
        }

        const info: Record<string, unknown> = await new Promise((r) => {
            hooks.onReleaseAvailable.intercept({
                register: (tapInfo) => {
                    r(tapInfo as unknown as Record<string, unknown>)
                    return tapInfo
                },
            })

            GitHubPlugin(hooks)
        })

        expect(info.type).toEqual('promise')
        expect(info.name).toEqual(PluginName)
    })

    it('throws an error if missing auth token', async () =>
        withMonorepoContext(
            {
                'pkg-1': {},
            },
            async (context) => {
                const config = {
                    ...(await getMonodeployConfig({
                        cwd: context.project.cwd,
                        baseBranch: 'main',
                        commitSha: 'shashasha',
                    })),
                }

                await expect(async () => {
                    await PluginInternals(context, config, {
                        'pkg-1': {
                            version: '1.0.0',
                            tag: 'pkg-1@1.0.0',
                            changelog: 'a new feature',
                        },
                    })
                }).rejects.toThrow(/Missing GitHub Personal Access Token/)
            },
        ))

    it('throws an error if cannot determine github owner or repository', async () =>
        withMonorepoContext(
            {
                'pkg-1': {},
            },
            async (context) => {
                const config = {
                    ...(await getMonodeployConfig({
                        cwd: context.project.cwd,
                        baseBranch: 'main',
                        commitSha: 'shashasha',
                    })),
                }

                const oldToken = process.env.GH_TOKEN
                process.env.GH_TOKEN = 'abc'
                try {
                    await expect(async () => {
                        await PluginInternals(context, config, {
                            'pkg-1': {
                                version: '1.0.0',
                                tag: 'pkg-1@1.0.0',
                                changelog: 'a new feature',
                            },
                        })
                    }).rejects.toThrow(/Cannot determine GitHub owner/)
                } finally {
                    process.env.GH_TOKEN = oldToken
                }
            },
            { root: { repository: 'something corrupted' } },
        ))

    it.todo('skips releases if no changelog available')

    it.todo('do not create a github release in dry run mode')

    it.todo('creates a github release outside of dry run mode')
})
