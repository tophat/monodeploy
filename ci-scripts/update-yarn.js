const { getPluginConfiguration } = require('@yarnpkg/cli')
const {
    Configuration,
    Project,
    Manifest,
    structUtils,
} = require ('@yarnpkg/core')
const querystring = require('querystring')

;(async () => {
    const commit = process.argv[2]

    if (!commit) {
        console.error('Missing commit.')
        return
    }

    const configuration = await Configuration.find(
        process.cwd(),
        getPluginConfiguration(),
    )
    const { project } = await Project.find(configuration, process.cwd())

    for (const workspace of project.workspaces) {
        if (workspace.manifest.private) continue

        for (const dependencyTypeKey of Manifest.allDependencies) {
            const dependencySet = workspace.manifest[dependencyTypeKey]
            if (!dependencySet) continue

            for (const [, descriptor] of dependencySet.entries()) {
                if (descriptor.scope !== 'yarnpkg') continue

                const range = structUtils.parseRange(descriptor.range, { parseSelector: true })
                const selector = querystring.stringify({
                    ...range.selector,
                    commit,
                }, '&', '=', { encodeURIComponent: v => v })
                const ident = structUtils.makeIdent(descriptor.scope, descriptor.name)
                const newDescriptor = structUtils.makeDescriptor(
                    ident,
                    structUtils.makeRange({ ...range, selector }),
                )

                dependencySet.set(ident.identHash, newDescriptor)
            }

        }

        await workspace.persistManifest()
    }
})()
