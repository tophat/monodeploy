// @ts-check

const independentWorkspaceIdents = new Set([
    'monodeploy',
    '@monodeploy/node',
    '@monodeploy/plugin-github',
])

/**
 * Enforces that all workspaces depend on each other using the workspace protocol.
 *
 * @param {import('@yarnpkg/types').Yarn.Constraints.Context} context
 */
function enforceWorkspaceDependenciesWhenPossible({ Yarn }) {
    for (const dependency of Yarn.dependencies()) {
        // Only enforce for workspaces
        if (!Yarn.workspace({ ident: dependency.ident })) continue

        if (!dependency.range.startsWith('workspace:')) {
            dependency.update('workspace:*')
        }
    }
}

/**
 * Enforces that @yarnpkg/* dependencies have consistent versions across
 * peer and dev dependencies. Since devDependencies are easily updated using
 * "yarn up" tooling and renovate, we will use the devDependency version as the
 * source of truth.
 *
 * @param {import('@yarnpkg/types').Yarn.Constraints.Context} context
 */
function enforceYarnLibraryPeerAndDevConsistency({ Yarn }) {
    for (const workspace of Yarn.workspaces()) {
        for (const peerDependency of Yarn.dependencies({ workspace, type: 'peerDependencies' })) {
            if (!peerDependency.ident.startsWith('@yarnpkg/')) continue

            const devDependency = Yarn.dependency({
                workspace,
                type: 'devDependencies',
                ident: peerDependency.ident,
            })
            if (devDependency) {
                peerDependency.update(devDependency.range)
            }
        }
    }
}

/**
 * Monodeploy (CLI + Node + Plugins) should satisfy all dependency's peers.
 *
 * @param {import('@yarnpkg/types').Yarn.Constraints.Context} context
 */
function enforceMonodeploySatisfiesPeersDirectly({ Yarn }) {
    for (const workspaceIdent of independentWorkspaceIdents) {
        const workspace = Yarn.workspace({ ident: workspaceIdent })
        if (!workspace) throw new Error(`Missing ${workspaceIdent}!`)
        for (const dependency of Yarn.dependencies({ workspace, type: 'dependencies' })) {
            if (!Yarn.workspace({ ident: dependency.ident })) continue
            // Get all peers of the dependency and make sure we satisfy them
            const peerDependencies = dependency.resolution?.peerDependencies
            if (!peerDependencies) continue
            for (const [peerName, peerRange] of peerDependencies.entries()) {
                workspace.set(['dependencies', peerName], peerRange)
            }
        }
    }
}

/**
 * Enforces required manifest fields for workspaces.
 *
 * @param {import('@yarnpkg/types').Yarn.Constraints.Context} context
 */
function enforceRequiredWorkspaceFields({ Yarn }) {
    for (const workspace of Yarn.workspaces()) {
        if (workspace.manifest.private) continue

        workspace.set(['repository', 'type'], 'git')
        workspace.set(['repository', 'url'], 'https://github.com/tophat/monodeploy.git')
        workspace.set(['repository', 'directory'], workspace.cwd)
        workspace.set(['publishConfig', 'registry'], 'https://registry.npmjs.org/')
        workspace.set(['publishConfig', 'access'], 'public')
    }
}

/**
 * Enforces Yarn libraries are declared as both peer and dependency.
 * Further, @yarnpkg/* should not be listed as a direct dependency.
 *
 * Exclude independent workspaces (they get handled by a separate constraint).
 *
 * @param {import('@yarnpkg/types').Yarn.Constraints.Context} context
 */
function enforceYarnLibrariesPeerAndDev({ Yarn }) {
    for (const workspace of Yarn.workspaces()) {
        if (workspace.manifest.private) continue
        if (workspace.ident && independentWorkspaceIdents.has(workspace.ident)) continue

        for (const dependency of Yarn.dependencies({ workspace })) {
            // Skip if not yarnpkg or if it's not peer/dep.
            if (
                !dependency.ident.startsWith('@yarnpkg/') ||
                dependency.type === 'devDependencies'
            ) {
                continue
            }

            // If it's a direct dependency, move it to peer and dev.
            if (dependency.type === 'dependencies') {
                workspace.set(['peerDependencies', dependency.ident], dependency.range)
                dependency.delete()
            } else if (dependency.type === 'peerDependencies') {
                const devDep = Yarn.dependency({ workspace, ident: dependency.ident })
                if (devDep) {
                    // If it's a peer, make sure it's also a dev.
                    // Use devDep as source of truth because 'yarn up' tooling modifies it directly
                    workspace.set(['devDependencies', dependency.ident], devDep.range)
                }
            }
        }
    }
}

module.exports = {
    async constraints(ctx) {
        enforceMonodeploySatisfiesPeersDirectly(ctx)
        enforceWorkspaceDependenciesWhenPossible(ctx)
        enforceYarnLibraryPeerAndDevConsistency(ctx)
        enforceYarnLibrariesPeerAndDev(ctx)
        enforceRequiredWorkspaceFields(ctx)
    },
}
