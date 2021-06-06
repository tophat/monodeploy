import { execSync } from 'child_process'
import { promises as fs } from 'fs'
import path from 'path'

import { YarnContext } from '@monodeploy/types'

import setupMonorepo from './setupMonorepo'

export async function initGitRepository(cwd: string): Promise<void> {
    execSync('git init', { cwd })
    // This is needed to disable signing if set up by the host.
    execSync('echo "[commit]\ngpgSign=false" > .git/config', { cwd })

    await fs.writeFile(path.resolve(cwd, '.gitignore'), ['.yarn'].join('\n'), {
        encoding: 'utf8',
    })
    execSync(`git add .gitignore && git commit -n -m "gitignore"`, { cwd })
}

export async function addGitRemote(
    cwd: string,
    remoteCwd: string,
    remoteName = 'origin',
): Promise<void> {
    execSync(`git remote add ${remoteName} ${remoteCwd}`, { cwd })
    execSync(`git remote set-url ${remoteName} ${remoteCwd}`, { cwd })
    execSync(`git remote set-url --push ${remoteName} ${remoteCwd}`, { cwd })
    execSync(`git branch -m master`, { cwd })
}

export async function setupTestRepository(
    ...setupArgs: unknown[]
): Promise<string> {
    let context: YarnContext
    if (setupArgs.length) {
        context = await setupMonorepo(
            ...(setupArgs as Parameters<typeof setupMonorepo> | never),
        )
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
        paths.map((path) => fs.rm(path, { recursive: true, force: true })),
    )
}

export async function createCommit(
    message: string,
    cwd: string,
): Promise<void> {
    execSync(`git add . && git commit -m "${message}"`, { cwd })
}
