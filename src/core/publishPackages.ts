import type { MonodeployConfiguration, YarnContext } from '../types'

const publishPackages = async (
    config: MonodeployConfiguration,
    context: YarnContext,
): Promise<void> => {
    // Pack the changed workspaces
    // TODO

    // Publish the changed workspaces
    // TODO

    // Push git tags
    // TODO
}

export default publishPackages
