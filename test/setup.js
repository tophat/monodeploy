import path from 'path'
import { vol } from 'memfs'

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

jest.mock('fs')
jest.mock('../src/command-helpers')
