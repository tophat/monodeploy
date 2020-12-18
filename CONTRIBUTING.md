# Contributing to Monodeploy

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

```sh
yarn test
```

## Build

You can execute `yarn build` to generate the `.tgz` package that ultimately gets uploaded to the NPM registry. It will also leave the intermediate `lib` artifacts, which contain the transpiled code.

You can use `yarn build:babel:watch` to rebuild the lib directory (minus typescript definitions) on source file change.

## Tips

### Debugging Yarn API Packages

You can unpack all yarn zips via:

```sh
yarn unplug @yarnpkg/*
```
