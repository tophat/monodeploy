const fs = require('fs').promises
const path = require('path')

function writePackageJsonFiles(packages) {
    return Promise.all(
        packages.map(({ pkg }) =>
            fs.writeFile(
                path.join(pkg.location, 'package.json'),
                JSON.stringify(pkg, null, 2),
            ),
        ),
    )
}

module.exports = writePackageJsonFiles
