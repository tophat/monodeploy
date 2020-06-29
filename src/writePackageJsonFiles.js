const fs = require('fs')
const path = require('path')

async function writePackageJsonFiles(packages) {
    for (const { pkg } of packages) {
        fs.writeFileSync(
            path.join(pkg.location, 'package.json'),
            JSON.stringify(pkg, null, 2),
        )
    }
}

module.exports = writePackageJsonFiles
