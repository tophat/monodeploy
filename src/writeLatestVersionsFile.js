const fs = require('fs').promises
const path = require('path')

async function writeLatestVersionFile(filepath, packages, { cwd }) {
    if (!filepath) {
        return
    }

    const packageInfo = packages.reduce((info, pkg) => {
        const { version, name, description } = pkg.toJSON()
        return info.concat({ version, name, description })
    }, [])

    await fs.writeFile(
        path.join(cwd, filepath),
        JSON.stringify(packageInfo, null, 2),
    )
}

module.exports = writeLatestVersionFile
