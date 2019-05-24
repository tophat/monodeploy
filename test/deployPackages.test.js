import path from 'path'
import { vol } from 'memfs'
import { deployPackages as _deployPackages } from '..'
import {
    __setLernaUpdatedSucceeds,
    lernaPublish,
    createGitTag,
    __setLernaPublishSucceeds,
    __setCreateGitTagSucceeds,
} from '../src/command-helpers'
import getPackageInfo from '../src/get-package-info'
import fs from 'fs'

describe('deployPackages function', () => {
    const stdout = jest.fn()
    const stderr = jest.fn()
    const deployPackages = (args = {}) =>
        _deployPackages({ ...args, stderr, stdout })

    beforeEach(async () => {
        stdout.mockClear()
        stderr.mockClear()
        lernaPublish.mockClear()
        createGitTag.mockClear()
    })

    describe('when it succeeds', () => {
        afterEach(() => {
            expect(stdout).toHaveBeenCalledTimes(1)
        })

        it('logs a list of packages', () =>
            expect(deployPackages())
                .resolves.toBeUndefined()
                .then(() => {
                    expect(
                        JSON.parse(stdout.mock.calls[0][0]),
                    ).toMatchSnapshot()
                }))

        it('does the publish if there are packages to publish', () => {
            __setLernaUpdatedSucceeds(true)
            __setLernaPublishSucceeds(true)

            return getPackageInfo().then(packages =>
                deployPackages().then(() => {
                    expect(lernaPublish).toHaveBeenCalled()
                    expect(createGitTag).toHaveBeenCalledTimes(packages.length)
                }),
            )
        })

        it('does not do the publish if there are no packages to publish', () => {
            __setLernaUpdatedSucceeds(true)
            __setLernaPublishSucceeds(true)
            vol.reset()
            vol.fromJSON({ packages: {} }, path.join(process.cwd()))
            return deployPackages().then(() => {
                expect(lernaPublish).not.toHaveBeenCalled()
                expect(createGitTag).not.toHaveBeenCalled()
            })
        })
    })

    const getPackageJsonContents = packageName =>
        fs.readFileSync(
            path.join(
                process.cwd(),
                'packages',
                packageName.replace('@thm/', ''),
                'package.json',
            ),
            'utf8',
        )

    it('updates the package.json files of the sibling packages', async () => {
        await deployPackages()
        const packageInfo = await getPackageInfo()
        packageInfo.forEach(({ name }) => {
            expect(getPackageJsonContents(name)).toMatchSnapshot()
        })
    })

    it('updates the package.json publish config if given', async () => {
        await deployPackages({
            registryUrl: 'http://example.com/production-registry/',
        })
        const packageInfo = await getPackageInfo()
        packageInfo.forEach(({ name }) => {
            expect(getPackageJsonContents(name)).toMatchSnapshot()
        })
    })

    describe('when it fails', () => {
        afterEach(() => {
            expect(stdout).not.toHaveBeenCalled()
        })

        it('throws an error if the lerna publish fails', () => {
            __setLernaUpdatedSucceeds(true)
            __setLernaPublishSucceeds(false)
            return expect(deployPackages()).rejects.toEqual(expect.any(Error))
        })

        it('throws an error if git tagging fails', () => {
            __setLernaUpdatedSucceeds(true)
            __setLernaPublishSucceeds(true)
            __setCreateGitTagSucceeds(false)
            return expect(deployPackages()).rejects.toEqual(expect.any(Error))
        })

        it('does not publish if lerna updated fails', () => {
            __setLernaUpdatedSucceeds(false)
            return expect(deployPackages())
                .rejects.toEqual(expect.any(Error))
                .then(() => {
                    expect(stderr).toHaveBeenCalled()
                    expect(lernaPublish).not.toHaveBeenCalled()
                })
        })
    })
})
