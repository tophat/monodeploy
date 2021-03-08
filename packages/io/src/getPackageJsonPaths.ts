import path from 'path'

import type { MonodeployConfiguration, YarnContext } from '@monodeploy/types'

const getPackageJsonPaths = async (
    config: MonodeployConfiguration,
    context: YarnContext,
): Promise<string[]> => {
    return [...context.project.topLevelWorkspace.workspacesCwds].map(wCwd =>
        path.join(path.resolve(config.cwd, wCwd), 'package.json'),
    )
}

export default getPackageJsonPaths
