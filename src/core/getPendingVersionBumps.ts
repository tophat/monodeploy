import { execSync } from 'child_process'
import { PortablePath } from '@yarnpkg/fslib'
import type {
    MonodeployConfiguration,
    PackageVersionBumps,
    YarnContext,
    PackageVersionBumpType,
} from '../types'

import getCommitMessages from '../utils/getCommitMessages'

const STRATEGY = {
    NONE: 0,
    PATCH: 1,
    MINOR: 2,
    MAJOR: 3,
}

const strategyLevelToType = (level: number): PackageVersionBumpType | null => {
    const name = Object.entries(STRATEGY)
        .find((key, value) => level === value)?.[0]
        ?.toLowerCase()
    if (name === 'none') return null
    return (name as PackageVersionBumpType | null) ?? null
}

const getModifiedPackages = async (
    config: MonodeployConfiguration,
    context: YarnContext,
): Promise<string[]> => {
    const stdout = execSync('git diff', { encoding: 'utf8' })
    const modifiedPathPattern = /^(\+{3}|\-{3})\s+[a-b]\/(.*\/.*\..*)$/gm
    const paths = [...stdout.matchAll(modifiedPathPattern)]
    const uniquePaths = paths.reduce(
        (uniquePaths: Set<string>, currentMatch: Array<string>) => {
            const currentPath = currentMatch[2]
            uniquePaths.add(currentPath)
            return uniquePaths
        },
        new Set(),
    )

    const modifiedPackages = [...uniquePaths].reduce(
        (modifiedPackages: Array<string>, path: string): Array<string> => {
            try {
                const workspace = context.project.getWorkspaceByFilePath(
                    path as PortablePath,
                )
                const packageName = workspace?.manifest?.name?.name
                if (packageName) modifiedPackages.push(packageName)
            } catch (e) {
                console.error(e)
            }
            return modifiedPackages
        },
        [],
    )
    return modifiedPackages
}

const getPendingVersionBumps = async (
    config: MonodeployConfiguration,
    context: YarnContext,
): Promise<PackageVersionBumps> => {
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

    const versionBumps: PackageVersionBumps = {}
    for (const pkgName of packageNames) {
        if (strategy) versionBumps[pkgName] = strategy
    }

    return versionBumps
}

export default getPendingVersionBumps
