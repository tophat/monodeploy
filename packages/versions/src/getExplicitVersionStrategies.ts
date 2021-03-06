import path from 'path'

import { getCommitMessages, gitDiffTree } from '@monodeploy/git'
import logging from '@monodeploy/logging'
import type {
    MonodeployConfiguration,
    PackageStrategyMap,
    PackageStrategyType,
    YarnContext,
} from '@monodeploy/types'
import { structUtils } from '@yarnpkg/core'
import { PortablePath } from '@yarnpkg/fslib'
import micromatch from 'micromatch'

import {
    STRATEGY,
    createGetConventionalRecommendedStrategy,
    getDefaultRecommendedStrategy,
    maxStrategy,
} from './versionStrategy'

const strategyLevelToType = (level: number): PackageStrategyType | null => {
    const name = Object.entries(STRATEGY)
        .find((key, value) => level === value)?.[0]
        ?.toLowerCase()
    if (name === 'none') return null
    return (name as PackageStrategyType | null) ?? null
}

const getModifiedPackages = async ({
    config,
    context,
    commitSha,
}: {
    config: MonodeployConfiguration
    context: YarnContext
    commitSha: string
}): Promise<string[]> => {
    const diffOutput = await gitDiffTree(commitSha, {
        cwd: config.cwd,
        context,
    })
    const paths = diffOutput.split('\n')
    const uniquePaths = paths.reduce(
        (uniquePaths: Set<string>, currentPath: string) => {
            if (currentPath) uniquePaths.add(currentPath)
            return uniquePaths
        },
        new Set(),
    )

    const ignorePatterns = config.changesetIgnorePatterns ?? []

    const modifiedPackages = [...uniquePaths].reduce(
        (modifiedPackages: string[], currentPath: string): string[] => {
            if (!micromatch([currentPath], ignorePatterns).length) {
                try {
                    const workspace = context.project.getWorkspaceByFilePath(
                        path.resolve(config.cwd, currentPath) as PortablePath,
                    )
                    const ident = workspace?.manifest?.name
                    if (!ident) throw new Error('Missing workspace identity.')
                    const packageName = structUtils.stringifyIdent(ident)
                    if (packageName && !workspace.manifest.private) {
                        modifiedPackages.push(packageName)
                    }
                } catch (e) {
                    logging.error(e, { report: context.report })
                }
            }
            return modifiedPackages
        },
        [],
    )
    return [...new Set(modifiedPackages)]
}

const getExplicitVersionStrategies = async ({
    config,
    context,
}: {
    config: MonodeployConfiguration
    context: YarnContext
}): Promise<PackageStrategyMap> => {
    const versionStrategies: PackageStrategyMap = new Map()

    const strategyDeterminer = config.conventionalChangelogConfig
        ? createGetConventionalRecommendedStrategy(config)
        : getDefaultRecommendedStrategy
    const commits = await getCommitMessages(config, context)
    for (const commit of commits) {
        const strategy = strategyLevelToType(
            await strategyDeterminer([commit.body]),
        )
        const packageNames = await getModifiedPackages({
            config,
            context,
            commitSha: commit.sha,
        })

        for (const pkgName of packageNames) {
            if (!strategy) continue

            const previousVersionStrategy = versionStrategies.get(pkgName)

            versionStrategies.set(pkgName, {
                type: await maxStrategy(
                    previousVersionStrategy?.type,
                    strategy,
                ),
                commits: [commit, ...(previousVersionStrategy?.commits ?? [])],
            })
        }
    }

    return versionStrategies
}

export default getExplicitVersionStrategies
