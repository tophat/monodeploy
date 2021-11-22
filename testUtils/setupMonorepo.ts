import { promises as fs } from 'fs'
import os from 'os'
import path from 'path'

import { YarnContext } from '@monodeploy/types'
import { Cache, StreamReport, ThrowReport, structUtils } from '@yarnpkg/core'
import { npath } from '@yarnpkg/fslib'

import { setupContext } from './misc'

const DEBUG = process.env.DEBUG === '1'

async function writeJSON(filename: string, data: Record<string, unknown>): Promise<void> {
    await fs.writeFile(filename, JSON.stringify(data), 'utf-8')
}

async function makeDependencyMap(
    packages: Array<string | [string, string]>,
    { useRelativePath = true }: { useRelativePath?: boolean } = {},
): Promise<Record<string, string>> {
    const dependencies: Record<string, string> = {}
    for (const pkg of packages) {
        if (Array.isArray(pkg)) {
            dependencies[pkg[0]] = pkg[1]
        } else {
            dependencies[pkg] = useRelativePath
                ? `workspace:packages/${structUtils.parseIdent(pkg).name}`
                : 'workspace:*'
        }
    }
    return dependencies
}

type PackageInitConfiguration = Partial<{
    dependencies: Array<string | [string, string]>
    devDependencies: Array<string | [string, string]>
    peerDependencies: Array<string | [string, string]>
    scripts: Record<string, string>
    private: boolean
    version: string
}>

type ProjectRootInitConfiguration = Partial<{
    dependencies: Record<string, string | [string, string]>
    repository: string
}>

export default async function setupMonorepo(
    monorepo: Record<string, PackageInitConfiguration>,
    {
        root,
        nodeLinker = 'pnp',
    }: {
        root?: ProjectRootInitConfiguration
        nodeLinker?: 'pnp' | 'pnpm' | 'node-modules'
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
        const pkgDir = path.join(workingDir, 'packages', structUtils.parseIdent(pkgName).name)
        await fs.mkdir(pkgDir, { recursive: true })

        await writeJSON(path.join(pkgDir, 'package.json'), {
            name: pkgName,
            version: pkgConfig.version ?? '0.0.0',
            private: pkgConfig.private || undefined,
            scripts: pkgConfig.scripts ?? {},
            dependencies: await makeDependencyMap(pkgConfig.dependencies ?? []),
            devDependencies: await makeDependencyMap(pkgConfig.devDependencies ?? []),
            peerDependencies: await makeDependencyMap(pkgConfig.peerDependencies ?? [], {
                useRelativePath: false,
            }),
        })
    }

    // Generate .yarnrc.yml
    const releasesDir = path.join(__dirname, '..', '.yarn', 'releases')
    await fs.mkdir(releasesDir, { recursive: true })
    const yarnBinary = path.resolve(path.join(releasesDir, 'yarn-3.1.0.cjs'))
    await fs.symlink(yarnBinary, path.join(workingDir, 'run-yarn.cjs'))

    const authIdent = Buffer.from('test-user:test-password').toString('base64')
    await fs.writeFile(
        path.join(workingDir, '.yarnrc.yml'),
        [
            'yarnPath: ./run-yarn.cjs',
            `nodeLinker: ${nodeLinker}`,
            'enableGlobalCache: false',
            ...(process.env.E2E === '1'
                ? [
                      "unsafeHttpWhitelist: ['localhost']",
                      'npmAlwaysAuth: true',
                      'npmRegistryServer: "http://localhost:4873"',
                      `npmRegistries:\n  "//localhost:4873":\n    npmAuthIdent: "${authIdent}"\n    npmAlwaysAuth: true`,
                  ]
                : []),
        ].join('\n'),
        'utf-8',
    )

    // Initialize project
    const context: YarnContext = await setupContext(npath.toPortablePath(workingDir))

    await context.project.install({
        cache: await Cache.find(context.configuration),
        report: DEBUG
            ? new StreamReport({ configuration: context.configuration, stdout: process.stdout })
            : new ThrowReport(),
    })

    return context
}

export async function withMonorepoContext(
    monorepo: Record<string, PackageInitConfiguration>,
    cb: (context: YarnContext) => Promise<void>,
    { root, debug }: { root?: ProjectRootInitConfiguration; debug?: boolean } = {},
): Promise<void> {
    const context = await setupMonorepo(monorepo, { root })
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
