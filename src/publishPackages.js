async function publishPackages(
    resources,
    { registryUrl, changelogPreset, cwd },
) {
    const publishOptions = {
        amend: true,
        yes: true,
        conventionalCommits: true,
        registry: registryUrl,
        changelogPreset,
        cwd,
        // Configure stderr logs that come from lerna (via npmlog). It might
        // make sense to silence these completely and have a set of monodeploy
        // logs instead.
        loglevel: 'error',
    }

    await resources.publish(publishOptions)
    // TODO: if publish fails, try again with "from-git" or "from-package"
}

module.exports = publishPackages
