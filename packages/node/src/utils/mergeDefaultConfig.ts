import { gitResolveSha } from '@monodeploy/git'
import {
    type MonodeployConfiguration,
    type RecursivePartial,
    RegistryMode,
} from '@monodeploy/types'
import { npath } from '@yarnpkg/fslib'

export const mergeDefaultConfig = async (
    baseConfig: RecursivePartial<MonodeployConfiguration>,
): Promise<MonodeployConfiguration> => {
    const cwd = npath.fromPortablePath(baseConfig.cwd ?? process.cwd())
    const prerelease = baseConfig.prerelease ?? false

    // deprecated option
    const noRegistry = baseConfig.noRegistry ?? false

    return {
        registryUrl: baseConfig.registryUrl ?? undefined,
        noRegistry,
        registryMode: noRegistry
            ? RegistryMode.Manifest
            : baseConfig.registryMode ?? RegistryMode.NPM,
        cwd,
        dryRun: baseConfig.dryRun ?? false,
        git: {
            baseBranch: baseConfig.git?.baseBranch,
            commitSha: baseConfig.git?.commitSha ?? (await gitResolveSha('HEAD', { cwd })),
            remote: baseConfig.git?.remote ?? 'origin',
            push: baseConfig.git?.push ?? false,
            tag: baseConfig.git?.tag ?? true,
        },
        conventionalChangelogConfig: baseConfig.conventionalChangelogConfig ?? undefined,
        changesetFilename: baseConfig.changesetFilename ?? undefined,
        applyChangeset: baseConfig.applyChangeset ?? false,
        changelogFilename: baseConfig.changelogFilename ?? undefined,
        changesetIgnorePatterns: baseConfig.changesetIgnorePatterns ?? [],
        forceWriteChangeFiles: baseConfig.forceWriteChangeFiles ?? false,
        access: baseConfig.access ?? 'infer',
        persistVersions: baseConfig.persistVersions ?? false,
        autoCommit: baseConfig.autoCommit ?? false,
        autoCommitMessage: baseConfig.autoCommitMessage ?? 'chore: release [skip ci]',
        commitIgnorePatterns: baseConfig.commitIgnorePatterns ?? undefined,
        topological: baseConfig.topological ?? false,
        topologicalDev: baseConfig.topologicalDev ?? false,
        jobs: baseConfig.jobs ?? 0,
        maxConcurrentReads: baseConfig.maxConcurrentReads ?? 0,
        maxConcurrentWrites: baseConfig.maxConcurrentWrites ?? 0,
        plugins: baseConfig.plugins ?? [],
        prerelease,
        prereleaseId: baseConfig.prereleaseId ?? 'rc',
        prereleaseNPMTag: baseConfig.prereleaseNPMTag ?? 'next',
        packageGroupManifestField: baseConfig.packageGroupManifestField ?? undefined,
        packageGroups: baseConfig.packageGroups,
    }
}
