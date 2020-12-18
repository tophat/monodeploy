import type {
    MonodeployConfiguration,
    PackageVersionBumps,
    YarnContext,
} from '../types'

const getPendingVersionBumps = async (
    config: MonodeployConfiguration,
    context: YarnContext,
): Promise<PackageVersionBumps> => {
    // TODO
    return { 'commit-utils-core': 'minor' }
}

export default getPendingVersionBumps
