import path from 'path'
import { vol } from 'memfs'
import mockRegistry from './mock-registry'

jest.mock('fs')
jest.mock('../src/command-helpers')

const packagesRoot = path.resolve(process.cwd(), 'packages')

const mockPackages = {
    '@thm/package1': {
        version: '1.0.0',
        dependencies: ['@thm/package2', '@thm/package3', 'lodash'],
    },
    '@thm/package2': {
        version: '0.3.0',
        dependencies: ['@thm/package3'],
    },
    '@thm/package3': {
        version: '2.3.1',
        dependencies: ['dayum'],
    },
}

beforeEach(() => {
    vol.reset()
    vol.fromJSON(
        Object.entries(mockPackages).reduce(
            (files, [packageName, { version, dependencies }]) =>
                Object.assign(files, {
                    [`${packageName.replace(
                        '@thm/',
                        '',
                    )}/package.json`]: JSON.stringify({
                        description: `A sample package ${packageName}`,
                        felibPackageGroup: 'components',
                        name: packageName,
                        version: version,
                        dependencies: dependencies.reduce(
                            (dependencyMap, dependency) =>
                                Object.assign(dependencyMap, {
                                    [dependency]: '*',
                                }),
                            {},
                        ),
                        publishConfig: {},
                    }),
                }),
            {},
        ),
        packagesRoot,
    )
    mockRegistry.reset()
    Object.entries(mockPackages).forEach(([packageName, { version }]) => {
        mockRegistry.publish(packageName, version)
    })
})
