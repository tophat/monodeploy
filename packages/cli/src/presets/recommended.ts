import type { ConfigFile } from '../types'

const ConfigRecommended: ConfigFile = {
    persistVersions: true,
    autoCommit: true,
    git: {
        push: true,
    },
    changesetIgnorePatterns: ['**/*.test.ts', '**/*.test.js'],
}

export = ConfigRecommended
