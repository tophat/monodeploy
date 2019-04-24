import fetchUpdatedPackageVersions from '../src/fetch-updated-package-versions'
import {
    __setLernaUpdatedJson,
} from '../src/command-helpers'
import mockRegistry from './mock-registry'
import getPackageInfo from '../src/get-package-info'

describe('fetchUpdatedPackageVersions function', () => {
    it('fetches the updated package versions', async () => {
        const packageInfo = await getPackageInfo({ useRegistry: true })

        __setLernaUpdatedJson(packageInfo)

        const versions = await fetchUpdatedPackageVersions()

        Object.entries(versions).forEach(([packageName, version]) => {
            expect(mockRegistry.view(packageName)).toBe(version)
        })
    })
})
