const actualModule = jest.requireActual('@yarnpkg/plugin-npm')

const registry = {
    tags: {},
}

const _reset_ = (): void => {
    registry.tags = {}
}

const _setTag_ = (pkgName: string, tag: string): void => {
    registry.tags[pkgName] = { latest: tag }
}

const npmHttpUtilsGet = (distTagUrl, { ident }) => {
    const pkgName = ident.scope ? `@${ident.scope}/${ident.name}` : ident.name
    const tags = registry.tags[pkgName]
    if (!tags) {
        throw new Error('HTTPError: 404 (Not Found)')
    }
    return tags
}

module.exports = {
    __esModule: true,
    ...actualModule,
    npmHttpUtils: {
        ...actualModule.npmHttpUtils,
        get: npmHttpUtilsGet,
    },
    _reset_,
    _setTag_,
}
