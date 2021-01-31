# Contributing to Monodeploy

## Quick Setup (Optional)

Just for initial setup.

```sh
. script/bootstrap
```

## Getting Started

Optionally install nvm to ensure you're using the correct version of node. You can find the node version in the `.nvmrc` file.

Instal dependencies.

```sh
yarn
```

and then install the git hooks:

```sh
yarn husky install
```

This project uses [Typescript](https://www.typescriptlang.org/), [Babel](https://babeljs.io/), and [Yarn Berry](https://yarnpkg.com/).

## Tests

Start the mock registry:

```sh
yarn test:registry
```

and then run the tests:

```sh
yarn test
```

You can run `yarn test:registry:logs` to see a live stream of the registry logs.

During development, you can usue the watch mode to have tests autorun on file changes:

```sh
yarn test:watch
```

## Build

You can execute `yarn pack --filename artifacts/package.tgz` to generate the `.tgz` package that ultimately gets uploaded to the NPM registry. It will also leave the intermediate `lib` artifacts, which contain the transpiled code.

You can use `yarn build:babel:watch` to rebuild the lib directory (minus typescript definitions) on source file change.

To regenerate typescript definition files (and to catch type violations):

```sh
yarn types:watch
```

## Using Example Monorepo

After building the code (via above watch commands), run:

```sh
yarn node lib/cli.js --cwd <PATH_TO_EXAMPLE_MONOREPO> \
    --dry-run --log-level 0 \
    --conventional-changelog-config @tophat/conventional-changelog-config
```

## Tips

### Configuring Your IDE

#### VSCode

You'll need to download the [ZipFS](https://marketplace.visualstudio.com/items?itemName=arcanis.vscode-zipfs) extension to be able to use functionality such as "Go To Definition" with the zipped npm packages.

In a Typescript file, <kbd>Cmd + Shift + P</kbd> will open the command menu. Select "TypeScript: Select Typescript Version..." and use the version from the workspace.

### Debugging Yarn API Packages

You can unpack all yarn zips via:

```sh
yarn unplug @yarnpkg/*
```

This will let you inspect yarn source code to debug stack traces.
