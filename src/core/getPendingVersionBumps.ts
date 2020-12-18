import type {
    MonodeployConfiguration,
    PackageVersionBumps,
    YarnContext,
} from '../types'

import getCommitMessages from '../utils/getCommitMessages'

const getPendingVersionBumps = async (
    config: MonodeployConfiguration,
    context: YarnContext,
): Promise<PackageVersionBumps> => {
    const commitMessages = await getCommitMessages(config)
    return { 'commit-utils-core': 'minor' }
}

export default getPendingVersionBumps
