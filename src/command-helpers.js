const childProcess = require('child_process')
const { promisify } = require('util')
const path = require('path')

const exec = promisify(childProcess.exec.bind(childProcess))

const lernaExecutable = path.join(
    process.cwd(),
    'node_modules',
    '.bin',
    'lerna',
)

function getLernaUpdatedJson() {
    return exec(`${lernaExecutable} updated --json`).catch(err => {
        if (err.message.includes('No packages need updating')) {
            return JSON.stringify([])
        }
        throw new Error(err)
    })
}

function getNpmVersionFromRegistry(packageName) {
    return exec(`npm view ${packageName} version`)
        .then(version => version.trim())
        .catch(err => {
            if (
                err.message.includes(
                    `'${packageName}' is not in the npm registry`,
                )
            ) {
                return '0.1.0'
            }
            throw new Error(err)
        })
}

function _extractNewVersionsFromPublishOutput(output) {
    return output
        .split('\n')
        .map(line => line.match(/- (.+): .+ => (.+)/))
        .filter(match => match !== null)
        .reduce(
            (updatedPackages, [, packageName, newVersion]) => ({
                ...updatedPackages,
                [packageName]: newVersion,
            }),
            {},
        )
}

async function lernaPublish({ registryUrl = null } = {}) {
    const command = [
        lernaExecutable,
        'publish',
        '--skip-git',
        '--conventional-commits',
        '--changelog-preset @thm/conventional-changelog-config',
        '--yes',
    ]

    if (registryUrl) {
        command.push('--registry', registryUrl)
    }

    const publishOutput = await exec(command.join(' '))

    return _extractNewVersionsFromPublishOutput(publishOutput)
}

function getUnscopedPackageName(packageName) {
    return packageName.split('/')[1]
}

function getChangelogLink(packageName) {
    const unscopedName = getUnscopedPackageName(packageName)
    return `http://felib.tophat.com/${unscopedName}/CHANGELOG`
}

function createGitTag(
    packageName,
    version,
    annotationMessage = null,
    suffix = '',
) {
    const tagName = `${packageName}@${version}`
    const annotation = annotationMessage ? `-a -m "${annotationMessage}"` : ''
    return exec(`git tag ${tagName}${suffix} ${annotation}`)
}

module.exports = {
    createGitTag,
    getChangelogLink,
    getLernaUpdatedJson,
    getNpmVersionFromRegistry,
    getUnscopedPackageName,
    lernaPublish,
}
