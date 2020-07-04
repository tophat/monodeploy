import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

import rimraf from 'rimraf'

import _monodeploy from '../src/index'

import InMemoryResources from './resources'

class GitRepo {
    _runCommand(command) {
        if (!this.cwd) throw new Error('must call init on git repo')
        execSync(`git ${command}`, { cwd: this.cwd })
    }

    init(cwd) {
        this.cwd = cwd
        this._runCommand('init')
    }

    commit({ message }) {
        this._runCommand(`commit -am "${message}"`)
    }

    add(files) {
        this._runCommand(`add ${files}`)
    }
}

class TestMonorepo {
    constructor({ packageNames } = {}, gitRepo = new GitRepo()) {
        this.packageNames = packageNames
        this.gitRepo = gitRepo
        this.directoryPath = fs.mkdtempSync(
            path.join(path.sep, 'tmp', 'monodeploy-'),
        )
        this.gitRepo.init(this.getPath())
    }

    init() {
        this.addFile(
            'lerna.json',
            JSON.stringify({
                packages: ['packages/*'],
                version: 'independent',
            }),
        )
        this.addFile(
            'package.json',
            JSON.stringify({
                private: true,
                version: '1.0.0',
                name: 'monorepo',
            }),
        )
        this.addDirectory('packages')
        this.packageNames.forEach(packageName => {
            this.addDirectory(path.join('packages', packageName))
            this.addFile(
                path.join('packages', packageName, 'package.json'),
                JSON.stringify({ version: '0.0.0', name: packageName }),
            )
        })
        this.gitRepo.add('.')
        this.gitRepo.commit({ message: 'Initial commit' })
    }

    addFile(name, contents) {
        fs.writeFileSync(path.join(this.getPath(), name), contents)
    }

    addDirectory(name) {
        fs.mkdirSync(path.join(this.getPath(), name))
    }

    delete() {
        rimraf.sync(this.getPath())
    }

    getPath() {
        return this.directoryPath
    }
}

describe('monodeploy', () => {
    let resources
    let monorepo

    beforeEach(() => {
        resources = new InMemoryResources()
        monorepo = new TestMonorepo({
            packageNames: ['package-0', 'package-1', 'package-2'],
        })
        monorepo.init()
    })

    afterEach(() => {
        monorepo.delete()
    })

    const monodeploy = options => {
        // Could not figure out how to pass cwd to git-raw-commits when it gets
        // called by conventional-changelog to update changelogs, so we settle
        // for mocking process.cwd which seems to work just fine
        jest.spyOn(process, 'cwd').mockImplementation(() => monorepo.getPath())
        return _monodeploy(options, monorepo.getPath(), resources)
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
