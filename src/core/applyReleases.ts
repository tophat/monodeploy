import type {
    MonodeployConfiguration,
    PackageVersionBumps,
    YarnContext,
} from '../types'

const applyReleases = async (
    config: MonodeployConfiguration,
    context: YarnContext,
    versionStrategies: PackageVersionBumps,
): Promise<void> => {

}

export default applyReleases
