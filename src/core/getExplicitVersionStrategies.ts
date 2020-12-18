import { execSync } from 'child_process'
import path from 'path'
import { PortablePath } from '@yarnpkg/fslib'
import { structUtils } from '@yarnpkg/core'

import logging from '../logging'
import type {
    MonodeployConfiguration,
    PackageStrategyMap,
    YarnContext,
    PackageStrategyType,
} from '../types'

import getCommitMessages from '../utils/getCommitMessages'

const STRATEGY = {
    NONE: 0,
    PATCH: 1,
    MINOR: 2,
    MAJOR: 3,
}

const strategyLevelToType = (level: number): PackageStrategyType | null => {
    const name = Object.entries(STRATEGY)
        .find((key, value) => level === value)?.[0]
        ?.toLowerCase()
    if (name === 'none') return null
    return (name as PackageStrategyType | null) ?? null
}

const getModifiedPackages = async (
    config: MonodeployConfiguration,
    context: YarnContext,
): Promise<string[]> => {
    const stdout = execSync(
        `git diff ${config.git.baseBranch}...${config.git.commitSha} --name-only`,
        {
            encoding: 'utf8',
            cwd: config.cwd,
        },
    )
    const paths = stdout.split('\n')
    const uniquePaths = paths.reduce(
        (uniquePaths: Set<string>, currentPath: string) => {
            if (currentPath) uniquePaths.add(currentPath)
            return uniquePaths
        },
        new Set(),
    )

    const modifiedPackages = [...uniquePaths].reduce(
        (modifiedPackages: string[], currentPath: string): string[] => {
            try {
                const workspace = context.project.getWorkspaceByFilePath(
                    path.resolve(config.cwd, currentPath) as PortablePath,
                )
                const ident = workspace?.manifest?.name
                if (!ident) throw new Error('Missing workspace identity.')
                const packageName = structUtils.stringifyIdent(ident)
                if (packageName) modifiedPackages.push(packageName)
            } catch (e) {
                logging.error(e)
            }
            return modifiedPackages
        },
        [],
    )
    return modifiedPackages
}

const getExplicitVersionStrategies = async (
    config: MonodeployConfiguration,
    context: YarnContext,
): Promise<PackageStrategyMap> => {
    const commitMessages = await getCommitMessages(config)
    const pattern = new RegExp('(w+)(\\([^:]+\\))?:.*')
    const strategies = commitMessages.map(msg => {
        const type = msg.match(pattern)?.[1]
        if (msg.includes('BREAKING CHANGE:')) return STRATEGY.MAJOR
        if (type) {
            if (['fix'].includes(type)) return STRATEGY.PATCH
            if (['feat'].includes(type)) return STRATEGY.MINOR
        }
        return STRATEGY.NONE
    })
    const strategy = strategyLevelToType(
        strategies.reduce((s, c) => Math.max(s, c)),
    )

    const packageNames = await getModifiedPackages(config, context)

    const versionStrategies: PackageStrategyMap = new Map()
    for (const pkgName of packageNames) {
        if (strategy) versionStrategies.set(pkgName, strategy)
    }

    return versionStrategies
}

export default getExplicitVersionStrategies
