import { deployPackages as _deployPackages } from './index'
import {
    __setLernaUpdatedSucceeds,
    lernaPublish,
    __setLernaUpdatedJson,
    createGitTag,
    __setLernaPublishSucceeds,
    __setCreateGitTagSucceeds,
} from '../command-helpers'

jest.mock('../command-helpers')
jest.mock('./update-package-versions', () => jest.fn())

const mockPackageList = [
    {
        name: 'package-1',
    },
    {
        name: 'package-2',
    },
]

describe('deployPackages function', () => {
    const stdout = jest.fn()
    const stderr = jest.fn()
    const deployPackages = () => _deployPackages({ stderr, stdout })

    beforeEach(() => {
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
                        JSON.parse(stdout.mock.calls[0][0]).find(
                            ({ name }) => name === '@thm/fe-common-components',
                        ),
                    ).toMatchSnapshot()
                }))

        it('does the publish if there are packages to publish', () => {
            __setLernaUpdatedSucceeds(true)
            __setLernaPublishSucceeds(true)
            __setLernaUpdatedJson(mockPackageList)
            return deployPackages().then(() => {
                expect(lernaPublish).toHaveBeenCalled()
                expect(createGitTag).toHaveBeenCalledTimes(
                    mockPackageList.length,
                )
            })
        })

        it('does not do the publish if there no packages to publish', () => {
            __setLernaUpdatedSucceeds(true)
            __setLernaPublishSucceeds(true)
            __setLernaUpdatedJson([])
            return deployPackages().then(() => {
                expect(lernaPublish).not.toHaveBeenCalled()
                expect(createGitTag).not.toHaveBeenCalled()
            })
        })
    })

    describe('when it fails', () => {
        afterEach(() => {
            expect(stdout).not.toHaveBeenCalled()
        })

        it('throws an error if the lerna publish fails', () => {
            __setLernaUpdatedSucceeds(true)
            __setLernaPublishSucceeds(false)
            __setLernaUpdatedJson(mockPackageList)
            return expect(deployPackages()).rejects.toEqual(expect.any(Error))
        })

        it('throws an error if git tagging fails', () => {
            __setLernaUpdatedJson(mockPackageList)
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
