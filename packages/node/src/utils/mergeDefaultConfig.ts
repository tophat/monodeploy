import { gitLastTaggedCommit, gitResolveSha } from 'monodeploy-git'
import type {
    MonodeployConfiguration,
    RecursivePartial,
} from 'monodeploy-types'

const mergeDefaultConfig = async (
    baseConfig: RecursivePartial<MonodeployConfiguration>,
): Promise<MonodeployConfiguration> => {
    const cwd = baseConfig.cwd ?? process.cwd()

    return {
        registryUrl: baseConfig.registryUrl ?? undefined,
        cwd,
        dryRun: baseConfig.dryRun ?? false,
        git: {
            baseBranch:
                baseConfig.git?.baseBranch ??
                (await gitLastTaggedCommit({ cwd })),
            commitSha:
                baseConfig.git?.commitSha ??
                (await gitResolveSha('HEAD', { cwd })),
            remote: baseConfig.git?.remote ?? 'origin',
            push: baseConfig.git?.push ?? false,
        },
        conventionalChangelogConfig:
            baseConfig.conventionalChangelogConfig ?? undefined,
        changesetFilename: baseConfig.changesetFilename ?? undefined,
        changelogFilename: baseConfig.changelogFilename ?? undefined,
        access: baseConfig.access ?? 'public',
        persistVersions: baseConfig.persistVersions ?? false,
        topologicalSort: baseConfig.topologicalSort ?? false,
    }
}

export default mergeDefaultConfig
