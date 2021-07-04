---
slug: "/configuration"
title: "Configuring - Monodeploy"
---

## Configuring Monodeploy

For a full list of CLI arguments, run:

```bash
yarn monodeploy --help
```

To fine-tune monodeploy, create a `monodeploy.config.js` file and invoke monodeploy via:

```bash
yarn monodeploy --config-file monodeploy.config.js
```

## Configuration File

If you omit a property, a reasonable default will be used. Note that setting a property to `null` is not always the same as omitting the property (or setting it to `undefined`).

```js
module.exports = {
    autoCommit: true,
    changelogFilename: 'CHANGELOG.md',
}
```

## Schema

```ts
export interface MonodeployConfiguration {
    registryUrl?: string
    noRegistry: boolean
    dryRun: boolean
    git: {
        baseBranch: string
        commitSha: string
        remote: string
        push: boolean
        tag: boolean
    }
    conventionalChangelogConfig?: string
    changesetFilename?: string
    changelogFilename?: string
    changesetIgnorePatterns?: Array<string>
    forceWriteChangeFiles: boolean
    access: string
    persistVersions: boolean
    autoCommit: boolean
    autoCommitMessage: string
    topological: boolean
    topologicalDev: boolean
    jobs: number
    maxConcurrentReads: number
    maxConcurrentWrites: number
    plugins?: Array<string>
    prerelease: boolean
    prereleaseId: string
    prereleaseNPMTag: string
}
```
