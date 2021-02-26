const { getPluginConfiguration } = require('@yarnpkg/cli')
const {
    Configuration,
    Project,
    Manifest,
    structUtils,
} = require ('@yarnpkg/core')
const pluginNPM = require('@yarnpkg/plugin-npm')
const querystring = require('querystring')

const tagCache = new Map()

const fetchLatestTag = async ({ ident, configuration }) => {
    if (tagCache.has(ident.identHash)) return tagCache.get(ident.identHash)

    const identUrl = pluginNPM.npmHttpUtils.getIdentUrl(ident)
    const distTagUrl = `/-/package${identUrl}/dist-tags`
    const result = await pluginNPM.npmHttpUtils.get(
        distTagUrl,
        {
            configuration,
            ident,
            jsonResponse: true,
        },
    )

    tagCache.set(ident.identHash, result.latest)
    return tagCache.get(ident.identHash)
}

;(async () => {
    tagCache.clear()

    const commitOrVersion = process.argv[2]

    if (!commitOrVersion) {
        console.error('Missing commit or version.')
        return
    }

    const isVersion = commitOrVersion === 'latest'

    const configuration = await Configuration.find(
        process.cwd(),
        getPluginConfiguration(),
    )
    const { project } = await Project.find(configuration, process.cwd())

    for (const workspace of project.workspaces) {
        for (const dependencyTypeKey of Manifest.allDependencies) {
            const dependencySet = workspace.manifest[dependencyTypeKey]
            if (!dependencySet) continue

            for (const [, descriptor] of dependencySet.entries()) {
                if (descriptor.scope !== 'yarnpkg') continue

                const range = structUtils.parseRange(descriptor.range, { parseSelector: true })
                const ident = structUtils.makeIdent(descriptor.scope, descriptor.name)

                if (isVersion) {
                    const latestVersion = await fetchLatestTag({ ident, configuration })
                    const newDescriptor = structUtils.makeDescriptor(
                        ident,
                        `^${latestVersion}`,
                    )
                    dependencySet.set(ident.identHash, newDescriptor)
                } else {
                    const selector = querystring.stringify({
                        ...range.selector,
                        commit,
                    }, '&', '=', { encodeURIComponent: v => v })
                    const newDescriptor = structUtils.makeDescriptor(
                        ident,
                        structUtils.makeRange({ ...range, selector }),
                    )

                    dependencySet.set(ident.identHash, newDescriptor)
                }
            }

        }

        await workspace.persistManifest()
    }
})()
