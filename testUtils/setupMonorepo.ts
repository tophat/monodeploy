import { promises as fs } from 'fs'
import os from 'os'
import path from 'path'

import { Cache, ThrowReport, structUtils } from '@yarnpkg/core'
import { npath } from '@yarnpkg/fslib'

import { YarnContext } from '@monodeploy/types'

import { setupContext } from './misc'

async function writeJSON(
    filename: string,
    data: Record<string, unknown>,
): Promise<void> {
    await fs.writeFile(filename, JSON.stringify(data), 'utf-8')
}

async function makeDependencyMap(
    packages: Array<string>,
): Promise<Record<string, string>> {
    const dependencies: Record<string, string> = {}
    for (const pkg of packages) {
        dependencies[pkg] = `workspace:packages/${
            structUtils.parseIdent(pkg).name
        }`
    }
    return dependencies
}

type PackageInitConfiguration = Partial<{
    dependencies: Array<string>
    devDependencies: Array<string>
    peerDependencies: Array<string>
    scripts: Record<string, string>
    private: boolean
    version: string
}>

export default async function setupMonorepo(
    monorepo: Record<string, PackageInitConfiguration>,
    {
        root,
    }: {
        root?: Partial<{
            dependencies: Record<string, string>
            repository: string
        }>
    } = {},
): Promise<YarnContext> {
    const workingDir = await fs.mkdtemp(path.join(os.tmpdir(), 'monorepo-'))

    // Generate root package.json
    await writeJSON(path.join(workingDir, 'package.json'), {
        name: 'monorepo',
        private: true,
        version: '1.0.0',
        workspaces: ['packages/*'],
        dependencies: root?.dependencies ?? {},
        repository: root?.repository,
    })

    // Generate children workspaces
    for (const [pkgName, pkgConfig] of Object.entries(monorepo)) {
        const pkgDir = path.join(
            workingDir,
            'packages',
            structUtils.parseIdent(pkgName).name,
        )
        await fs.mkdir(pkgDir, { recursive: true })

        await writeJSON(path.join(pkgDir, 'package.json'), {
            name: pkgName,
            version: pkgConfig.version ?? '0.0.0',
            private: pkgConfig.private || undefined,
            scripts: pkgConfig.scripts ?? {},
            dependencies: await makeDependencyMap(pkgConfig.dependencies ?? []),
            devDependencies: await makeDependencyMap(
                pkgConfig.devDependencies ?? [],
            ),
            peerDependencies: await makeDependencyMap(
                pkgConfig.peerDependencies ?? [],
            ),
        })
    }

    // Generate .yarnrc.yml
    const releasesDir = path.join(__dirname, '..', '.yarn', 'releases')
    await fs.mkdir(releasesDir, { recursive: true })
    const yarnBinary = path.resolve(path.join(releasesDir, 'yarn-2.4.1.cjs'))
    await fs.symlink(yarnBinary, path.join(workingDir, 'run-yarn.cjs'))
    await fs.writeFile(
        path.join(workingDir, '.yarnrc.yml'),
        `yarnPath: ./run-yarn.cjs\nenableGlobalCache: false`,
        'utf-8',
    )

    // Initialize project
    const context = await setupContext(npath.toPortablePath(workingDir))

    await context.project.install({
        cache: await Cache.find(context.configuration),
        report: new ThrowReport(),
    })

    return context
}

export async function withMonorepoContext(
    monorepo: Record<string, PackageInitConfiguration>,
    cb: (context: YarnContext) => Promise<void>,
    debug = false,
): Promise<void> {
    const context = await setupMonorepo(monorepo)
    const cwd = context.project.cwd
    try {
        await cb(context)
    } finally {
        if (debug) {
            console.log(`Working Directory: ${cwd}`)
        } else {
            await fs.rm(cwd, { recursive: true, force: true })
        }
    }
}
