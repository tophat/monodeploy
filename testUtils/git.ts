import { execSync } from 'child_process'
import { promises as fs } from 'fs'
import { tmpdir } from 'os'
import { join, resolve } from 'path'

export async function setupTestRepository(): Promise<string> {
    const rootPath = await fs.mkdtemp(join(tmpdir(), 'test-repository-'))

    const exampleMonorepo = resolve(join(process.cwd(), './example-monorepo'))

    execSync(`cp -r ${exampleMonorepo}/* ${rootPath}`)
    execSync('git init', { cwd: rootPath })
    // This is needed to disable signing if set up by the host.
    execSync('echo "[commit]\ngpgSign=false" > .git/config', { cwd: rootPath })
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
