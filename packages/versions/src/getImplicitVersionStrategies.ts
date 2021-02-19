import { getDependents } from 'monodeploy-dependencies'
import type {
    MonodeployConfiguration,
    PackageStrategyMap,
    YarnContext,
} from 'monodeploy-types'

const getImplicitVersionStrategies = async (
    config: MonodeployConfiguration,
    context: YarnContext,
    intentionalStrategies: PackageStrategyMap,
): Promise<PackageStrategyMap> => {
    const dependents = await getDependents(
        config,
        context,
        new Set(intentionalStrategies.keys()),
    )
    const requiresUpdate = new Map()
    for (const dependent of dependents) {
        requiresUpdate.set(dependent, { type: 'patch', commits: [] })
    }

    return requiresUpdate
}

export default getImplicitVersionStrategies
