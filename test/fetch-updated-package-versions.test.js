import fetchUpdatedPackageVersions from '../src/fetch-updated-package-versions'
import {
    __setNpmRegistryVersion,
    __setLernaUpdatedJson,
} from '../src/command-helpers'

describe('fetchUpdatedPackageVersions function', () => {
    it('fetches the updated package versions', async () => {
        const mockPackageMap = {
            'package-1': '0.2.0',
            'package-2': '0.3.0',
        }
        Object.entries(mockPackageMap).forEach(([packageName, version]) => {
            __setNpmRegistryVersion(packageName, version)
        })
        __setLernaUpdatedJson(
            Object.keys(mockPackageMap).map(packageName => ({
                name: packageName,
            })),
        )
        const versions = await fetchUpdatedPackageVersions()
        expect(versions).toMatchObject(mockPackageMap)
    })
})
