import { createMonorepoContext, getMonodeployConfig } from '@monodeploy/test-utils'
import { type PluginHooks } from '@monodeploy/types'
import { AsyncSeriesHook } from 'tapable'

import { createPluginInternals } from './plugin'
import * as requestModule from './request'

import GitHubPlugin, { PluginName } from '.'

jest.mock('./request', () => ({
    request: jest.fn(),
}))

describe('GitHub Plugin', () => {
    afterEach(() => {
        delete process.env.GH_TOKEN
        jest.resetAllMocks()
    })

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

        expect(info.type).toBe('promise')
        expect(info.name).toEqual(PluginName)
    })

    it('throws an error if missing auth token', async () => {
        await using context = await createMonorepoContext({
            'pkg-1': {},
        })
        const config = {
            ...(await getMonodeployConfig({
                cwd: context.project.cwd,
                baseBranch: 'main',
                commitSha: 'shashasha',
            })),
        }

        await expect(async () => {
            await createPluginInternals({})(context, config, {
                'pkg-1': {
                    version: '1.0.0',
                    tag: 'pkg-1@1.0.0',
                    changelog: 'a new feature',
                    group: 'pkg-1',
                },
            })
        }).rejects.toThrow(/Missing GitHub Personal Access Token/)
    })

    it('throws an error if cannot determine github owner or repository', async () => {
        await using context = await createMonorepoContext(
            {
                'pkg-1': {},
            },
            { root: { repository: 'corrupted repository' } },
        )
        const config = {
            ...(await getMonodeployConfig({
                cwd: context.project.cwd,
                baseBranch: 'main',
                commitSha: 'shashasha',
            })),
        }

        process.env.GH_TOKEN = 'abc'

        await expect(async () => {
            await createPluginInternals({})(context, config, {
                'pkg-1': {
                    version: '1.0.0',
                    tag: 'pkg-1@1.0.0',
                    changelog: 'a new feature',
                    group: 'pkg-1',
                },
            })
        }).rejects.toThrow(/Cannot determine GitHub owner/)
    })

    it('skips releases if no changelog available and includeImplicitUpdates is disabled', async () => {
        await using context = await createMonorepoContext(
            {
                'pkg-1': {},
            },
            { root: { repository: 'https://github.com/example/repo.git' } },
        )
        const config = {
            ...(await getMonodeployConfig({
                cwd: context.project.cwd,
                baseBranch: 'main',
                commitSha: 'shashasha',
            })),
        }

        process.env.GH_TOKEN = 'abc'

        const spyRequest = jest.spyOn(requestModule, 'request')
        await createPluginInternals({ includeImplicitUpdates: false })(context, config, {
            'pkg-1': {
                version: '1.0.0',
                tag: 'pkg-1@1.0.0',
                changelog: null,
                group: 'pkg-1',
            },
        })
        expect(spyRequest).not.toHaveBeenCalled()
    })

    it('includes releases if no changelog available and includeImplicitUpdates is enabled', async () => {
        await using context = await createMonorepoContext(
            {
                'pkg-1': {},
            },
            { root: { repository: 'https://github.com/example/repo.git' } },
        )
        const config = {
            ...(await getMonodeployConfig({
                cwd: context.project.cwd,
                baseBranch: 'main',
                commitSha: 'shashasha',
            })),
        }

        process.env.GH_TOKEN = 'abc'

        const spyRequest = jest.spyOn(requestModule, 'request')
        await createPluginInternals({ includeImplicitUpdates: true })(context, config, {
            'pkg-1': {
                version: '1.0.0',
                tag: 'pkg-1@1.0.0',
                changelog: null,
                group: 'pkg-1',
            },
        })
        expect(spyRequest).toHaveBeenCalledWith(
            expect.anything(),
            expect.any(String),
            expect.objectContaining({
                owner: 'example',
                repo: 'repo',
                tag_name: 'pkg-1@1.0.0',
                prerelease: false,
                body: 'Implicit version bump due to dependency updates.',
            }),
        )
    })

    it('do not create a github release in dry run mode', async () => {
        await using context = await createMonorepoContext(
            {
                'pkg-1': {},
            },
            { root: { repository: 'https://github.com/example/repo.git' } },
        )
        const config = {
            ...(await getMonodeployConfig({
                cwd: context.project.cwd,
                baseBranch: 'main',
                commitSha: 'shashasha',
                dryRun: true,
            })),
        }
        process.env.GH_TOKEN = 'abc'

        const spyRequest = jest.spyOn(requestModule, 'request')
        await createPluginInternals({})(context, config, {
            'pkg-1': {
                version: '1.0.0',
                tag: 'pkg-1@1.0.0',
                changelog: 'a new feature',
                group: 'pkg-1',
            },
        })
        expect(spyRequest).not.toHaveBeenCalled()
    })

    it('creates a github release outside of dry run mode', async () => {
        await using context = await createMonorepoContext(
            {
                'pkg-1': {},
            },
            { root: { repository: 'https://github.com/example/repo.git' } },
        )
        const config = {
            ...(await getMonodeployConfig({
                cwd: context.project.cwd,
                baseBranch: 'main',
                commitSha: 'shashasha',
            })),
        }

        process.env.GH_TOKEN = 'abc'

        const spyRequest = jest.spyOn(requestModule, 'request')
        await createPluginInternals({})(context, config, {
            'pkg-1': {
                version: '1.0.0',
                tag: 'pkg-1@1.0.0',
                changelog: 'a new feature',
                group: 'pkg-1',
            },
        })
        expect(spyRequest).toHaveBeenCalledWith(
            expect.anything(),
            expect.any(String),
            expect.objectContaining({
                owner: 'example',
                repo: 'repo',
                tag_name: 'pkg-1@1.0.0',
                prerelease: false,
                body: 'a new feature',
            }),
        )
    })
})
