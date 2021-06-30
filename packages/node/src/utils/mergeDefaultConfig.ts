import { gitLastTaggedCommit, gitResolveSha } from '@monodeploy/git'
import type {
    MonodeployConfiguration,
    RecursivePartial,
} from '@monodeploy/types'

const mergeDefaultConfig = async (
    baseConfig: RecursivePartial<MonodeployConfiguration>,
): Promise<MonodeployConfiguration> => {
    const cwd = baseConfig.cwd ?? process.cwd()
    const prerelease = baseConfig.prerelease ?? false

    return {
        registryUrl: baseConfig.registryUrl ?? undefined,
        noRegistry: baseConfig.noRegistry ?? false,
        cwd,
        dryRun: baseConfig.dryRun ?? false,
        git: {
            baseBranch:
                baseConfig.git?.baseBranch ??
                (await gitLastTaggedCommit({ cwd, prerelease })),
            commitSha:
                baseConfig.git?.commitSha ??
                (await gitResolveSha('HEAD', { cwd })),
            remote: baseConfig.git?.remote ?? 'origin',
            push: baseConfig.git?.push ?? false,
            tag: baseConfig.git?.tag ?? true,
        },
        conventionalChangelogConfig:
            baseConfig.conventionalChangelogConfig ?? undefined,
        changesetFilename: baseConfig.changesetFilename ?? undefined,
        changelogFilename: baseConfig.changelogFilename ?? undefined,
        changesetIgnorePatterns: baseConfig.changesetIgnorePatterns ?? [],
        forceWriteChangeFiles: baseConfig.forceWriteChangeFiles ?? false,
        access: baseConfig.access ?? 'public',
        persistVersions: baseConfig.persistVersions ?? false,
        autoCommit: baseConfig.autoCommit ?? false,
        autoCommitMessage:
            baseConfig.autoCommitMessage ?? 'chore: release [skip ci]',
        topological: baseConfig.topological ?? false,
        topologicalDev: baseConfig.topologicalDev ?? false,
        jobs: baseConfig.jobs ?? 0,
        maxConcurrentReads: baseConfig.maxConcurrentReads ?? 0,
        maxConcurrentWrites: baseConfig.maxConcurrentWrites ?? 0,
        plugins: baseConfig.plugins ?? [],
        prerelease,
        prereleaseId: baseConfig.prereleaseId ?? 'rc',
        prereleaseNPMTag: baseConfig.prereleaseNPMTag ?? 'next',
    }
}

export default mergeDefaultConfig
