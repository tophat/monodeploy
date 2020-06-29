import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

import lernaVersion from '@lerna/version'
import { getPackages } from '@lerna/project'
import rimraf from 'rimraf'

import _monodeploy from '../src/monodeploy.js'

jest.unmock('fs')

class RegistryManager {
    constructor() {
        this.registries = {}
    }

    publish(packageJson, registryUrl = 'DEFAULT_REGISTRY/') {
        const { name } = packageJson

        if (!this.registries[registryUrl]) {
            this.registries[registryUrl] = {}
        }

        if (!this.registries[registryUrl][name]) {
            this.registries[registryUrl][name] = []
        }

        this.registries[registryUrl][name].push(packageJson)
    }

    getLatestVersion(pkg, registryUrl = 'DEFAULT_REGISTRY/') {
        const versions = this.registries[registryUrl][pkg]
        return versions[versions.length - 1].version
    }
}

class InMemoryResources {
    constructor(registryManager = new RegistryManager()) {
        this.registryManager = registryManager
    }

    getPackageLatestVersion(packageName, { registryUrl } = {}) {
        return Promise.resolve(
            this.registryManager.getLatestVersion(packageName, registryUrl),
        )
    }

    async publish(options) {
        await lernaVersion(options)
        const packages = await getPackages(options.cwd)
        for (const pkg of packages) {
            this.registryManager.publish(pkg.toJSON(), options.registryUrl)
        }
    }
}

describe('monodeploy', () => {
    let monorepoDirectory
    let resources

    beforeEach(() => {
        monorepoDirectory = fs.mkdtempSync(
            path.join(path.sep, 'tmp', 'monodeploy-'),
        )
        resources = new InMemoryResources()

        execSync('git init', { cwd: monorepoDirectory })
        fs.writeFileSync(
            path.join(monorepoDirectory, 'lerna.json'),
            JSON.stringify({
                packages: ['packages/*'],
                version: 'independent',
            }),
        )
        fs.writeFileSync(
            path.join(monorepoDirectory, 'package.json'),
            JSON.stringify({
                private: true,
                version: '1.0.0',
                name: 'monorepo',
            }),
        )
        fs.mkdirSync(path.join(monorepoDirectory, 'packages'))
        Array(3)
            .fill()
            .forEach((_, i) => {
                const packageName = `package-${i}`
                fs.mkdirSync(
                    path.join(monorepoDirectory, 'packages', packageName),
                )
                fs.writeFileSync(
                    path.join(
                        monorepoDirectory,
                        'packages',
                        packageName,
                        'package.json',
                    ),
                    JSON.stringify(
                        { version: '0.0.0', name: packageName },
                        null,
                        2,
                    ),
                )
            })
        execSync('git add . && git commit -m "Initial commit"', {
            cwd: monorepoDirectory,
        })
    })

    afterEach(() => {
        rimraf.sync(monorepoDirectory)
    })

    const monodeploy = options => {
        // Could not figure out how to pass cwd to git-raw-commits when it gets
        // called by conventional-changelog to update changelogs, so we settle
        // for mocking process.cwd which seems to work just fine
        jest.spyOn(process, 'cwd').mockImplementation(() => monorepoDirectory)
        return _monodeploy(options, monorepoDirectory, resources)
    }

    it('works', async () => {
        await monodeploy()
        await expect(
            resources.getPackageLatestVersion('package-0'),
        ).resolves.toBe('0.1.1')
        await expect(
            resources.getPackageLatestVersion('package-1'),
        ).resolves.toBe('0.1.1')
        await expect(
            resources.getPackageLatestVersion('package-2'),
        ).resolves.toBe('0.1.1')
    })

    it('does not bump packages if they have not been changed', async () => {
        await monodeploy()
        await expect(
            resources.getPackageLatestVersion('package-0'),
        ).resolves.toBe('0.1.1')
        await expect(
            resources.getPackageLatestVersion('package-1'),
        ).resolves.toBe('0.1.1')
        await expect(
            resources.getPackageLatestVersion('package-2'),
        ).resolves.toBe('0.1.1')
        await monodeploy()
        await expect(
            resources.getPackageLatestVersion('package-0'),
        ).resolves.toBe('0.1.1')
        await expect(
            resources.getPackageLatestVersion('package-1'),
        ).resolves.toBe('0.1.1')
        await expect(
            resources.getPackageLatestVersion('package-2'),
        ).resolves.toBe('0.1.1')
    })
})
