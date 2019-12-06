import fetchUpdatedPackageVersions from '../src/fetch-updated-package-versions'

import mockRegistry from './mock-registry'

describe('fetchUpdatedPackageVersions function', () => {
    it('fetches the updated package versions', async () => {
        const versions = await fetchUpdatedPackageVersions()

        Object.entries(versions).forEach(([packageName, version]) => {
            expect(mockRegistry.view(packageName)).toBe(version)
        })
    })
})
