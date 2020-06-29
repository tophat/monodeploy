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
    }

    await resources.publish(publishOptions)
    // TODO: if publish fails, try again with "from-git" or "from-package"
}

module.exports = publishPackages
