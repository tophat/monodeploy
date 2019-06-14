const fs = require('fs')
const { getNpmVersionFromRegistry } = require('./command-helpers')
const path = require('path')
const root = './packages'

const updatePackageJsonVersions = (
    changedPackages,
    { registryUrl, scopeToStrip = '' } = {},
) =>
    Promise.all(
        Object.entries(changedPackages).map(
            ([packageName, currentRegistryVersion]) => {
                const modifiedPackageName = scopeToStrip
                    ? packageName.split(scopeToStrip).pop()
                    : packageName
                const packageJsonFilePath = path.join(
                    process.cwd(),
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
                            const isSiblingPackage = scopeToStrip
                                ? dependencyName.startsWith(scopeToStrip)
                                : false
                            if (isSiblingPackage) {
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
                            map[name] = version
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
