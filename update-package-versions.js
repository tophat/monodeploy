const fs = require('fs')
const { getNpmVersionFromRegistry } = require('./command-helpers')
const path = require('path')
const root = './packages'

// TODO: tests
const updatePackageJsonVersions = (changedPackages, { registryUrl } = {}) =>
    Promise.all(
        Object.entries(changedPackages).map(
            ([packageName, currentRegistryVersion]) => {
                const modifiedPackageName = packageName.split('@thm/').pop()
                const packageJsonFilePath = path.join(
                    __dirname,
                    '..',
                    '..',
                    root,
                    modifiedPackageName,
                    'package.json',
                )
                const packageFileContent = JSON.parse(
                    fs.readFileSync(packageJsonFilePath),
                )
                return Promise.all(
                    Object.entries(packageFileContent.dependencies || {}).map(
                        ([dependencyName, dependencyVersion]) => {
                            if (dependencyName.startsWith('@thm')) {
                                return getNpmVersionFromRegistry(
                                    dependencyName,
                                ).then(version => [
                                    dependencyName,
                                    `^${version}`,
                                ])
                            }
                            return [dependencyName, dependencyVersion]
                        },
                    ),
                ).then(dependencies => {
                    const dependencyMap = dependencies.reduce(
                        (map, [name, version]) => {
                            map[name] = version // eslint-disable-line no-param-reassign

                            return map
                        },
                        {},
                    )
                    packageFileContent.version = currentRegistryVersion
                    packageFileContent.dependencies = dependencyMap
                    if (registryUrl && packageFileContent.publishConfig) {
                        packageFileContent.publishConfig.registry = registryUrl
                    }
                    fs.writeFileSync(
                        packageJsonFilePath,
                        JSON.stringify(packageFileContent, null, 4),
                    )
                })
            },
        ),
    )

module.exports = updatePackageJsonVersions
