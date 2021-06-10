import { PluginHooks } from '@monodeploy/types'

export const PluginName = 'GitHub Plugin'
import { PluginInternals } from './plugin'

export default function GitHubPlugin({
    onReleaseAvailable,
}: Pick<PluginHooks, 'onReleaseAvailable'>): void {
    onReleaseAvailable.tapPromise(PluginName, PluginInternals)
}
