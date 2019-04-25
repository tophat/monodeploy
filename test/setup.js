import path from 'path'
import { vol } from 'memfs'
import mockRegistry from './mock-registry'

jest.mock('fs')
jest.mock('../src/command-helpers')

const packagesRoot = path.resolve(process.cwd(), 'packages')

const mockPackages = {
    package1: '1.0.0',
    package2: '0.3.0',
    package3: '2.3.1',
}

beforeEach(() => {
    vol.fromJSON(
        Object.entries(mockPackages).reduce(
            (files, [packageName, version]) =>
                Object.assign(files, {
                    [`${packageName}/package.json`]: JSON.stringify({
                        description: `A sample package ${packageName}`,
                        felibPackageGroup: 'components',
                        name: packageName,
                        version: version,
                    }),
                }),
            {},
        ),
        packagesRoot,
    )
    mockRegistry.reset()
    Object.entries(mockPackages).forEach(([packageName, version]) => {
        mockRegistry.publish(packageName, version)
    })
})
