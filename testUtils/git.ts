import { execSync } from 'child_process'
import { promises as fs } from 'fs'

import { YarnContext } from '@monodeploy/types'

import setupMonorepo from './setupMonorepo'

export async function initGitRepository(cwd: string): Promise<void> {
    execSync('git init', { cwd })
    // This is needed to disable signing if set up by the host.
    execSync('echo "[commit]\ngpgSign=false" > .git/config', { cwd })
}

export async function setupTestRepository(
    ...setupArgs: Parameters<typeof setupMonorepo>
): Promise<string> {
    let context: YarnContext
    if (setupArgs.length) {
        context = await setupMonorepo(...setupArgs)
    } else {
        context = await setupMonorepo({
            'pkg-1': {},
            'pkg-2': {},
            'pkg-3': { dependencies: ['pkg-2'] },
            'pkg-4': {},
            'pkg-5': { private: true, dependencies: ['pkg-4'] },
            'pkg-6': {
                dependencies: ['pkg-3', 'pkg-7'],
            },
            'pkg-7': {},
        })
    }
    const rootPath = context.project.cwd
    await initGitRepository(rootPath)
    return rootPath
}

export async function cleanUp(paths: string[]): Promise<void> {
    await Promise.all(
        paths.map(path => fs.rm(path, { recursive: true, force: true })),
    )
}

export async function createCommit(
    message: string,
    cwd: string,
): Promise<void> {
    execSync(`git add . && git commit -m "${message}"`, { cwd })
}
