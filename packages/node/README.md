# Monodeploy Node

This package exposes a Node API for Monodeploy. It provides an alternative to the CLI.

## Installation

```sh
yarn add @monodeploy/node
```

## Usage

```ts
import type { MonodeployConfiguration }  from '@monodeploy/types'
import monodeploy from '@monodeploy/node'

try {
    const config: MonodeployConfiguration = {
        cwd: process.cwd(),
        dryRun: false,
        git: {
            baseBranch: 'main',
            commitSha: 'HEAD',
            remote: 'origin',
            push: true,
        },
        conventionalChangelogConfig: '@tophat/conventional-changelog-config',
        access: 'public',
    }
    const changeset = await monodeploy(config)
} catch (err) {
    console.error(err)
}
```
