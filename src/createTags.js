const { exec: _exec } = require('child_process')
const { promisify } = require('util')

const exec = promisify(_exec)

function createTags(packages, { cwd }) {
    return Promise.all(
        packages.map(pkg => {
            const tag = `${pkg.name}@${pkg.version}`
            return exec(`git tag ${tag} -m ${tag}`, { cwd })
        }),
    )
}

module.exports = createTags
