# monodeploy

<span><img align="right" width="200" height="200" src="./website/static/img/monodeploy.svg" alt="monodeploy"></span>

[![npm](https://img.shields.io/npm/v/monodeploy.svg)](https://www.npmjs.com/package/monodeploy)
[![npm downloads](https://img.shields.io/npm/dm/monodeploy.svg)](https://npm-stat.com/charts.html?package=monodeploy)
[![CircleCI](https://img.shields.io/circleci/project/github/tophat/monodeploy/master.svg)](https://circleci.com/gh/tophat/monodeploy)
[![codecov](https://codecov.io/gh/tophat/monodeploy/branch/master/graph/badge.svg)](https://codecov.io/gh/tophat/monodeploy)
[![All Contributors](https://img.shields.io/badge/all_contributors-5-orange.svg?style=flat-square)](#contributors)
[![Greenkeeper badge](https://badges.greenkeeper.io/tophat/monodeploy.svg)](https://greenkeeper.io/)

A small wrapper around lerna that makes it easier to use in CI

## Installation

```sh
yarn add --dev monodeploy
```

or

```sh
npm install --save-dev monodeploy
```

## Why monodeploy?

As a monorepo manager, [lerna](https://github.com/lerna/lerna) is a great tool, but it's not necessarily easy to use in CI if you want to publish all your packages every master build. Here are some problems you might encounter:

- Running `lerna publish` in CI pushes back to your git repository, which may fail if commits have been pushed to your master branch in the meantime.
- lerna requires all package versions to be stored in your repository, in their respective package.json files, therefore it's not possible to simply skip pushing to git from CI by using the [`--no-push`](https://github.com/lerna/lerna/tree/master/commands/version#--no-push) option when publishing.

monodeploy allows you to publish NPM packages from a monorepo in CI, using lerna, on every single master build, without storing your version numbers in your package.json files and without having CI commit back to your repo.
We could argue back and forth about whether or not it's good idea to publish NPM packages every single build to master (maybe [`--canary`](https://github.com/lerna/lerna/tree/master/commands/publish#--canary) builds would be better), and we could certainly agree that not storing version numbers in package.json files is confusing, but in some cases the benefits of such a scheme outweigh the shortcomings, and monodeploy is intended to suit those scenarios.

## How does monodeploy work?

monodeploy uses the registry as the single source of truth for package version numbers. At a high level, it does the following:

1. Use lerna to determine which packages need to be published
1. Retrieve the latest versions of these packages from the registry
1. Update the package.json files for these packages with the latest version numbers from the registry
1. Use lerna to bump the package versions and publish to the registry without commiting to the repo or pushing to the remote
1. Create git tags for each newly published package
1. Output a JSON list of all packages in your monorepo, including their latest version numbers.

## Contributors

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore -->
<table><tr><td align="center"><a href="http://msrose.github.io"><img src="https://avatars3.githubusercontent.com/u/3495264?v=4" width="100px;" alt="Michael Rose"/><br /><sub><b>Michael Rose</b></sub></a><br /><a href="https://github.com/tophat/monodeploy/commits?author=msrose" title="Code">💻</a> <a href="https://github.com/tophat/monodeploy/commits?author=msrose" title="Tests">⚠️</a></td><td align="center"><a href="https://github.com/thebrendan"><img src="https://avatars1.githubusercontent.com/u/48444889?v=4" width="100px;" alt="Brendan Hall-Hern"/><br /><sub><b>Brendan Hall-Hern</b></sub></a><br /><a href="https://github.com/tophat/monodeploy/commits?author=thebrendan" title="Code">💻</a></td><td align="center"><a href="https://opensource.tophat.com"><img src="https://avatars0.githubusercontent.com/u/6020693?v=4" width="100px;" alt="Shouvik DCosta"/><br /><sub><b>Shouvik DCosta</b></sub></a><br /><a href="https://github.com/tophat/monodeploy/commits?author=sdcosta" title="Code">💻</a></td><td align="center"><a href="https://github.com/maryampaz"><img src="https://avatars1.githubusercontent.com/u/30090413?v=4" width="100px;" alt="Maryam Pazirandeh"/><br /><sub><b>Maryam Pazirandeh</b></sub></a><br /><a href="#design-maryampaz" title="Design">🎨</a></td><td align="center"><a href="https://jakebolam.com"><img src="https://avatars2.githubusercontent.com/u/3534236?v=4" width="100px;" alt="Jake Bolam"/><br /><sub><b>Jake Bolam</b></sub></a><br /><a href="https://github.com/tophat/monodeploy/commits?author=jakebolam" title="Documentation">📖</a></td></tr></table>

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!

## Credits

Special thanks to [Carol Skelly](https://github.com/iatek) for donating the 'tophat' GitHub organization.
