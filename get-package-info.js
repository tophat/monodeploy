/* eslint-disable no-console */
const fs = require('fs')
const path = require('path')

const { getNpmVersionFromRegistry } = require('./command-helpers')

const packagesRoot = path.resolve(__dirname, '../packages')

function getPackageInfo({ useRegistry, knownPackages = {} } = {}) {
    return Promise.all(
        fs.readdirSync(packagesRoot).reduce((promises, pkgName) => {
            const packageJsonPath = path.resolve(
                packagesRoot,
                pkgName,
                'package.json',
            )
            try {
                const fileContents = fs.readFileSync(packageJsonPath)
                const packageJsonData = JSON.parse(fileContents)
                const fullPackageName = packageJsonData.name

                const versionPromise =
                    useRegistry && !knownPackages[fullPackageName]
                        ? getNpmVersionFromRegistry(fullPackageName)
                        : Promise.resolve(
                              knownPackages[fullPackageName] ||
                                  packageJsonData.version,
                          )

                return [
                    ...promises,
                    versionPromise.then(version => ({
                        description: packageJsonData.description,
                        group: packageJsonData.felibPackageGroup,
                        name: packageJsonData.name,
                        version,
                    })),
                ]
            } catch (ignored) {
                return promises
            }
        }, []),
    )
}

module.exports = getPackageInfo
