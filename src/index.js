/* eslint-disable no-console */

const fetchUpdatedPackageVersions = require('./fetch-updated-package-versions')
const updatePackageJsonVersions = require('./update-package-versions')
const {
    lernaPublish,
    createGitTag,
    getChangelogLink,
} = require('./command-helpers')
const getPackageInfo = require('./get-package-info')

const deployPackages = async ({
    stderr = console.error.bind(console),
    stdout = console.log.bind(console),
    registryUrl,
    gitTagSuffix,
} = {}) => {
    let changedPackages
    try {
        changedPackages = await fetchUpdatedPackageVersions()
    } catch (e) {
        stderr('Failed to fetch updated packages.', e)
        throw new Error(e)
    }

    const changedPackageNames = Object.keys(changedPackages)

    let newPackageVersions

    if (changedPackageNames.length !== 0) {
        await updatePackageJsonVersions(changedPackages, { registryUrl })

        try {
            newPackageVersions = await lernaPublish({ registryUrl })
        } catch (e) {
            stderr('Failed to run lerna publish!', e)
            throw new Error(e)
        }

        changedPackageNames.forEach(changedPackageName => {
            if (!newPackageVersions[changedPackageName]) {
                stderr(
                    `WARNING: ${changedPackageName} does not have a new version as reported by publish step.\n` +
                        'Is there something wrong with the extraction of new versions from publish output?',
                )
            }
        })

        if (
            changedPackageNames.length !==
            Object.keys(newPackageVersions).length
        ) {
            stderr(
                `WARNING: publish step reported more changed packages than expected.\n` +
                    'Is there something wrong with the extraction of new versions from publish output?',
            )
        }

        try {
            await Promise.all(
                Object.entries(
                    newPackageVersions,
                ).map(([packageName, newVersion]) =>
                    createGitTag(
                        packageName,
                        newVersion,
                        `View changelog at ${getChangelogLink(packageName)}`,
                        gitTagSuffix,
                    ),
                ),
            )
        } catch (e) {
            stderr(
                'Failed to create git tags! If the publish succeeded, you should' +
                    ' make sure there are git tags for every published package!',
                e,
            )
            throw new Error(e)
        }
    } else {
        stderr('No packages to update!')
    }

    stderr(`Deployed new package versions for: ${changedPackageNames}`)

    const packageInfo = await getPackageInfo({
        knownPackages: newPackageVersions,
        useRegistry: true,
    })
    stdout(JSON.stringify(packageInfo))
}

exports.deployPackages = deployPackages

if (require.main === module) {
    const [registryUrl, gitTagSuffix] = process.argv.slice(2)
    console.error(`Deploying packages to ${registryUrl}...`)
    ;(async () => {
        try {
            await deployPackages({ gitTagSuffix, registryUrl })
        } catch (e) {
            console.error('Fatal error when deploying!', e)
            process.exit(1)
        }
    })()
}
