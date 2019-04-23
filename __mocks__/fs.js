import { fs, vol } from 'memfs'
import path from 'path'

const packagesRoot = path.resolve(process.cwd(), 'packages')
vol.fromJSON(
    {
        'package1/package.json': JSON.stringify({
            "description": "A collection of common visual components.",
            "felibPackageGroup": "components",
            "name": "@thm/fe-common-components",
            "version": "0.1.0",
          }),
        'package2/package.json': '{}',
        'package3/package.json': '{}',
    },
    packagesRoot
)

// This needs to be module.exports, not export default, in order to mock fs properly
module.exports = fs
