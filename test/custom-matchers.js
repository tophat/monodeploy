export function makeVersionMatcher(getResources) {
    return {
        async toHaveVersion(pkg, expected) {
            const version =
                typeof expected === 'string' ? expected : expected.version
            const { registryUrl } = expected
            const latestVersion = await getResources().getPackageLatestVersion(
                pkg,
                registryUrl ? { registryUrl } : {},
            )
            if (latestVersion === version) {
                return {
                    pass: true,
                    message: () =>
                        `expected ${pkg} not to have latest version ${version}, but it did`,
                }
            } else {
                return {
                    pass: false,
                    message: () =>
                        `expected ${pkg} to have latest version ${version}, but instead it was ${latestVersion}`,
                }
            }
        },
    }
}
