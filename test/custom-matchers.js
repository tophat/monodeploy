export function makeVersionMatcher(getResources) {
    return {
        async toHaveVersion(received, expected) {
            const latestVersion = await getResources().getPackageLatestVersion(
                received,
            )
            if (latestVersion === expected) {
                return {
                    pass: true,
                    message: () =>
                        `expected ${received} not to have latest version ${expected}, but it did`,
                }
            } else {
                return {
                    pass: false,
                    message: () =>
                        `expected ${received} to have latest version ${expected}, but instead it was ${latestVersion}`,
                }
            }
        },
    }
}
