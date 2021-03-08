import { MessageName, ReportError, structUtils } from '@yarnpkg/core'

const actualModule = jest.requireActual('@yarnpkg/plugin-npm')

const registry = {
    tags: {},
}

const _reset_ = (): void => {
    registry.tags = {}
}

const _setTag_ = (
    pkgName: string,
    tagValue: string,
    tagKey = 'latest',
): void => {
    registry.tags[pkgName] = { ...registry.tags[pkgName], [tagKey]: tagValue }
}

const npmHttpUtilsGet = (distTagUrl, { ident }) => {
    const pkgName = structUtils.stringifyIdent(ident)
    const tags = registry.tags[pkgName]
    if (!tags) {
        throw new ReportError(
            MessageName.AUTHENTICATION_INVALID,
            `Cannot access ${pkgName}`,
        )
    }
    return tags
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const npmHttpUtilsPut = (identUrl, body, configuration) => {
    const pkgName = body.name
    for (const [key, version] of Object.entries(body['dist-tags'])) {
        _setTag_(pkgName, version as string, key)
    }
}

module.exports = {
    __esModule: true,
    ...actualModule,
    npmHttpUtils: {
        ...actualModule.npmHttpUtils,
        get: npmHttpUtilsGet,
        put: npmHttpUtilsPut,
    },
    _reset_,
    _setTag_,
}
