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

This project use Typescript, Babel, and Yarn Berry.

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

## Build

You can execute `yarn build` to generate the `.tgz` package that ultimately gets uploaded to the NPM registry. It will also leave the intermediate `lib` artifacts, which contain the transpiled code.

You can use `yarn build:babel:watch` to rebuild the lib directory (minus typescript definitions) on source file change.

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
