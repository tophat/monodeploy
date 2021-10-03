import { promises as fs } from 'fs'
import path from 'path'

import { exec } from '@monodeploy/io'
import { YarnContext } from '@monodeploy/types'
import { PortablePath, npath } from '@yarnpkg/fslib'

import setupMonorepo from './setupMonorepo'

export async function initGitRepository(
    cwd: PortablePath,
    { allowScaffoldingCommits = true }: { allowScaffoldingCommits?: boolean } = {},
): Promise<void> {
    await exec('git init', { cwd })
    await exec('git branch -m main', { cwd })
    // This is needed to disable signing if set up by the host.
    await exec('echo "[commit]\ngpgSign=false" > .git/config', { cwd })

    await fs.writeFile(
        path.resolve(npath.fromPortablePath(cwd), '.gitignore'),
        ['.yarn', '*.tmp', '.pnp.*'].join('\n'),
        {
            encoding: 'utf8',
        },
    )
    if (allowScaffoldingCommits) {
        await exec('git add .gitignore && git commit -n -m "gitignore"', { cwd })
    }
}

export async function addGitRemote(
    cwd: string,
    remoteCwd: string,
    remoteName = 'origin',
): Promise<void> {
    const pcwd = npath.toPortablePath(cwd)
    await exec(`git remote add ${remoteName} ${remoteCwd}`, { cwd: pcwd })
    await exec(`git remote set-url ${remoteName} ${remoteCwd}`, { cwd: pcwd })
    await exec(`git remote set-url --push ${remoteName} ${remoteCwd}`, { cwd: pcwd })
    await exec('git branch -m main', { cwd: pcwd })
}

export async function setupTestRepository(...setupArgs: unknown[]): Promise<PortablePath> {
    let context: YarnContext
    if (setupArgs.length) {
        context = await setupMonorepo(...(setupArgs as Parameters<typeof setupMonorepo> | never))
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
    await Promise.all(paths.map((path) => fs.rm(path, { recursive: true, force: true })))
}

export async function createCommit(message: string, cwd: string): Promise<void> {
    await exec(`git add . && git commit -m "${message}"`, { cwd: npath.toPortablePath(cwd) })
}
