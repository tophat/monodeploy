import { Ident, structUtils } from '@yarnpkg/core'

const getIdentFromName = (packageName: string): Ident => {
    if (!packageName.startsWith('@')) {
        return structUtils.makeIdent(null, packageName)
    }

    const [scope, name] = packageName.split('/')
    return structUtils.makeIdent(scope.substring(1), name)
}

export default getIdentFromName
