import { exec as _exec } from 'child_process'
import { promises as fs, mkdtempSync } from 'fs'
import path from 'path'
import { promisify } from 'util'

import _rimraf from 'rimraf'

import _monodeploy from '../src/index'

import InMemoryResources from './resources'

const exec = promisify(_exec)
const rimraf = promisify(_rimraf)

// Actual output from lerna is annoying in tests. Output from this function is
// anything lerna wants to go to stdout, so it's not configurable with the
// logger (npmlog) which is for things that go to stderr.
jest.mock('@lerna/output', () => () => {})

class GitRepo {
    constructor(cwd) {
        this.cwd = cwd
    }

    _runCommand(command) {
        return exec(`git ${command}`, { cwd: this.cwd })
    }

    init() {
        return this._runCommand('init')
    }

    commit({ message }) {
        return this._runCommand(`commit -am "${message}"`)
    }

    add(files) {
        return this._runCommand(`add ${files}`)
    }
}

class TestMonorepo {
    constructor({ packages } = {}) {
        this.dependencyGraph = packages
        this.directoryPath = mkdtempSync(
            path.join(path.sep, 'tmp', 'monodeploy-'),
        )
        this.gitRepo = new GitRepo(this.getPath())
    }

    async init() {
        this.addFile(
            'lerna.json',
            JSON.stringify({
                packages: ['packages/*'],
                version: 'independent',
            }),
        )
        await this.addFile(
            'package.json',
            JSON.stringify({
                private: true,
                version: '1.0.0',
                name: 'monorepo',
            }),
        )
        await this.addDirectory('packages')
        await Promise.all(
            Object.entries(this.dependencyGraph).map(
                ([packageName, dependencies]) => {
                    return this.createPackage(packageName, dependencies)
                },
            ),
        )
        await this.gitRepo.init()
        await this.commitChanges({ message: 'Initial commit' })
    }

    addFile(name, contents) {
        return fs.writeFile(path.join(this.getPath(), name), contents)
    }

    addFileToPackage(packageName, filename, contents) {
        this.addFile(path.join('packages', packageName, filename), contents)
    }

    addDirectory(name) {
        return fs.mkdir(path.join(this.getPath(), name))
    }

    async createPackage(name, dependencies) {
        await this.addDirectory(path.join('packages', name))
        await this.addFileToPackage(
            name,
            'package.json',
            JSON.stringify({
                version: '0.0.0',
                name,
                dependencies: dependencies.reduce(
                    (dependencyMap, dependency) => ({
                        ...dependencyMap,
                        [dependency]: '*',
                    }),
                    {},
                ),
            }),
        )
    }

    getPackageJSON(name) {
        return fs.readFile(
            path.join(this.getPath(), 'packages', name, 'package.json'),
            'utf-8',
        )
    }

    async commitChanges({ message }) {
        await this.gitRepo.add('.')
        await this.gitRepo.commit({ message })
    }

    delete() {
        return rimraf(this.getPath())
    }

    getPath() {
        return this.directoryPath
    }
}

describe('monodeploy', () => {
    let resources

    expect.extend({
        async toHaveVersion(received, expected) {
            const latestVersion = await resources.getPackageLatestVersion(
                received,
            )
            if (latestVersion === expected) {
                return {
                    pass: true,
                    message: () =>
                        `expected ${received} not to have latest version ${expected}, but it did`,
                }
            } else {
                return {
                    pass: false,
                    message: () =>
                        `expected ${received} to have latest version ${expected}, but instead it was ${latestVersion}`,
                }
            }
        },
    })

    beforeEach(async () => {
        resources = new InMemoryResources()
    })

    const createMonorepo = async packages => {
        const monorepo = new TestMonorepo(packages)
        await monorepo.init()
        return monorepo
    }

    const monodeploy = (monorepo, options) => {
        // Could not figure out how to pass cwd to git-raw-commits when it gets
        // called by conventional-changelog to update changelogs, so we settle
        // for mocking process.cwd which seems to work just fine
        jest.spyOn(process, 'cwd').mockImplementation(() => monorepo.getPath())
        return _monodeploy(options, monorepo.getPath(), resources)
    }

    // Use a weird context manager style API to make sure we clean up the
    // monorepo at the end.  Using afterEach to clean up doesn't work in this
    // case for some reason, maybe because of some way jest handles async tests
    const withMonorepo = monorepo => {
        return {
            async do(fn) {
                await fn(monorepo)
                await monorepo.delete()
            },
        }
    }

    it('publishes packages for the first time', async () => {
        const monorepo = await createMonorepo({
            packages: { 'package-0': [], 'package-1': [], 'package-2': [] },
        })
        await withMonorepo(monorepo).do(async () => {
            await monodeploy(monorepo)
            await expect('package-0').toHaveVersion('1.0.1')
            await expect('package-1').toHaveVersion('1.0.1')
            await expect('package-2').toHaveVersion('1.0.1')
        })
    })

    it('does not bump packages if they have not been changed', async () => {
        const monorepo = await createMonorepo({
            packages: { 'package-0': [], 'package-1': [], 'package-2': [] },
        })
        await withMonorepo(monorepo).do(async () => {
            await monodeploy(monorepo)
            await expect('package-0').toHaveVersion('1.0.1')
            await expect('package-1').toHaveVersion('1.0.1')
            await expect('package-2').toHaveVersion('1.0.1')
            await monodeploy(monorepo)
            await expect('package-0').toHaveVersion('1.0.1')
            await expect('package-1').toHaveVersion('1.0.1')
            await expect('package-2').toHaveVersion('1.0.1')
        })
    })

    it('bumps the version of changed packages', async () => {
        const monorepo = await createMonorepo({
            packages: { 'package-0': [], 'package-1': [], 'package-2': [] },
        })
        await withMonorepo(monorepo).do(async () => {
            await monodeploy(monorepo)
            await monorepo.addFileToPackage(
                'package-0',
                'newFile.js',
                'console.log("hi")',
            )
            await monorepo.commitChanges({ message: 'Add newFile' })
            await monodeploy(monorepo)
            await expect('package-0').toHaveVersion('1.0.2')
            await expect('package-1').toHaveVersion('1.0.1')
            await expect('package-2').toHaveVersion('1.0.1')
        })
    })

    it('bumps dependent packages', async () => {
        const monorepo = await createMonorepo({
            packages: {
                'package-0': ['package-1'],
                'package-1': [],
                'package-2': [],
            },
        })
        await withMonorepo(monorepo).do(async () => {
            await monodeploy(monorepo)
            await monorepo.addFileToPackage(
                'package-1',
                'newFile.js',
                'console.log("hi")',
            )
            await monorepo.commitChanges({ message: 'Add newFile' })
            await monodeploy(monorepo)
            await expect('package-0').toHaveVersion('1.0.2')
            await expect('package-1').toHaveVersion('1.0.2')
            await expect('package-2').toHaveVersion('1.0.1')
        })
    })

    it('writes a latest versions file if name is given', async () => {
        const monorepo = await createMonorepo({
            packages: { 'package-0': [], 'package-1': [], 'package-2': [] },
        })
        await withMonorepo(monorepo).do(async () => {
            await monodeploy(monorepo, {
                latestVersionsFile: 'latest-versions.json',
            })
            const latestVersionsContents = await fs.readFile(
                path.join(monorepo.getPath(), 'latest-versions.json'),
                'utf-8',
            )
            expect(latestVersionsContents).toMatchSnapshot()
        })
    })

    it('bumps the minor version for features', async () => {
        const monorepo = await createMonorepo({
            packages: { 'package-0': [], 'package-1': [], 'package-2': [] },
        })
        await withMonorepo(monorepo).do(async () => {
            await monodeploy(monorepo)
            await monorepo.addFileToPackage(
                'package-1',
                'newFile.js',
                'console.log("hi")',
            )
            await monorepo.commitChanges({ message: 'feat: Add newFile' })
            await monodeploy(monorepo)
            await expect('package-0').toHaveVersion('1.0.1')
            await expect('package-1').toHaveVersion('1.1.0')
            await expect('package-2').toHaveVersion('1.0.1')
        })
    })

    it('bumps the major version for breaking changes', async () => {
        const monorepo = await createMonorepo({
            packages: { 'package-0': [], 'package-1': [], 'package-2': [] },
        })
        await withMonorepo(monorepo).do(async () => {
            await monodeploy(monorepo)
            await monorepo.addFileToPackage(
                'package-1',
                'newFile.js',
                'console.log("hi")',
            )
            await monorepo.commitChanges({
                message: 'feat: Add newFile\n\nBREAKING CHANGE: Yeet the yeet',
            })
            await monodeploy(monorepo)
            await expect('package-1').toHaveVersion('2.0.0')
        })
    })

    it('updates the package.json files of the published packages', async () => {
        const monorepo = await createMonorepo({
            packages: {
                'package-0': ['package-1'],
                'package-1': [],
                'package-2': [],
            },
        })
        await withMonorepo(monorepo).do(async () => {
            await monodeploy(monorepo)
            await monorepo.addFileToPackage(
                'package-1',
                'newFile.js',
                'console.log("hi")',
            )
            await monorepo.commitChanges({ message: 'Add newFile' })
            await monodeploy(monorepo)
            expect(await monorepo.getPackageJSON('package-0')).toMatchSnapshot()
            expect(await monorepo.getPackageJSON('package-1')).toMatchSnapshot()
            expect(await monorepo.getPackageJSON('package-2')).toMatchSnapshot()
        })
    })
})
