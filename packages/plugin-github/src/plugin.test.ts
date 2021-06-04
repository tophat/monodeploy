import { PluginHooks } from '@monodeploy/types'
import { AsyncSeriesHook } from 'tapable'

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
})
