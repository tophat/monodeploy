import { promises as fs } from 'fs'
import path from 'path'

import _monodeploy from '../src/index'

import InMemoryResources from './resources'
import TestMonorepo from './test-monorepo'
import { makeVersionMatcher } from './custom-matchers'
import RegistryManager from './mockRegistry'

// Actual output from lerna is annoying in tests. Output from this function is
// anything lerna wants to go to stdout, so it's not configurable with the
// logger (npmlog) which is for things that go to stderr.
jest.mock('@lerna/output', () => () => {})

describe('monodeploy', () => {
    let resources
    let registryManager

    expect.extend(makeVersionMatcher(() => resources))

    beforeEach(() => {
        registryManager = new RegistryManager()
        resources = new InMemoryResources(registryManager)
    })

    const createMonorepo = async (packages, lernaConfig = {}) => {
        const monorepo = new TestMonorepo(packages)
        await monorepo.init(lernaConfig)
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
            await expect(latestVersionsContents).toMatchSnapshot()
        })
    })

    it('respects latest version files created outside current working directory', async () => {
        const monorepo = await createMonorepo({
            packages: { 'package-0': [], 'package-1': [], 'package-2': [] },
        })
        await withMonorepo(monorepo).do(async () => {
            await monodeploy(monorepo, {
                latestVersionsFile: '/tmp/latest-versions.json',
            })
            const latestVersionsContents = await fs.readFile(
                '/tmp/latest-versions.json',
                'utf-8',
            )
            await expect(latestVersionsContents).toMatchSnapshot()
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
                'package-1': ['package-2'],
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

    it('ignores changes based on the lerna publish command config', async () => {
        const monorepo = await createMonorepo(
            { packages: { 'package-0': [] } },
            { command: { publish: { ignoreChanges: ['*.test.js'] } } },
        )
        await withMonorepo(monorepo).do(async () => {
            await monodeploy(monorepo)
            await expect('package-0').toHaveVersion('1.0.1')
            await monorepo.addFileToPackage(
                'package-0',
                'index.test.js',
                'console.log("hi")',
            )
            await monorepo.commitChanges({ message: 'Add tests' })
            await monodeploy(monorepo)
            await expect('package-0').toHaveVersion('1.0.1')
        })
    })

    it('fails if there are unknown errors when fetching package versions', async () => {
        const monorepo = await createMonorepo({ packages: { 'package-0': [] } })
        const error = new Error('unknown error')
        registryManager.failFetchForPackage('package-0', error)
        await withMonorepo(monorepo).do(async () => {
            await expect(monodeploy(monorepo)).rejects.toBe(error)
        })
    })

    it('allows publishing to different registries', async () => {
        const monorepo = await createMonorepo({ packages: { 'package-0': [] } })
        registryManager.createRegistry('http://zombo.com')
        await withMonorepo(monorepo).do(async () => {
            await monodeploy(monorepo)
            await expect('package-0').toHaveVersion('1.0.1')
            await monodeploy(monorepo, { registryUrl: 'http://zombo.com' })
            await expect('package-0').toHaveVersion({
                version: '1.0.1',
                registryUrl: 'http://zombo.com',
            })
        })
    })

    it('creates git tags for all published packages', async () => {
        const monorepo = await createMonorepo({
            packages: {
                'package-0': [],
                'package-1': [],
                'package-2': [],
            },
        })
        await withMonorepo(monorepo).do(async () => {
            await monodeploy(monorepo)
            expect(await monorepo.getTags()).toEqual([
                'package-0@1.0.1',
                'package-1@1.0.1',
                'package-2@1.0.1',
            ])
        })
    })
})
