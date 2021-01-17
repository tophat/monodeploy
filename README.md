# monodeploy

<span><img align="right" width="200" height="200" src="./assets/monodeploy.svg" alt="monodeploy"></span>

[![Continuous Integration](https://github.com/tophat/monodeploy/workflows/Continuous%20Integration/badge.svg?branch=next%2Fv2)](https://github.com/tophat/monodeploy/actions?query=workflow%3A%22Continuous+Integration%22)
[![codecov](https://codecov.io/gh/tophat/monodeploy/branch/master/graph/badge.svg)](https://codecov.io/gh/tophat/monodeploy)
[![Dependabot Status](https://api.dependabot.com/badges/status?host=github&repo=tophat/monodeploy)](https://dependabot.com)
[![Maturity badge - level 2](https://img.shields.io/badge/Maturity-Level%202%20--%20First%20Release-yellowgreen.svg)](https://github.com/tophat/getting-started/blob/master/scorecard.md)
[![GitHub license](https://img.shields.io/github/license/tophat/monodeploy)](https://github.com/tophat/monodeploy/blob/master/LICENSE)
[![Slack workspace](https://slackinvite.dev.tophat.com/badge.svg)](https://opensource.tophat.com/slack) <!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-10-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->

![node-current](https://img.shields.io/node/v/monodeploy)
[![npm](https://img.shields.io/npm/v/monodeploy.svg)](https://www.npmjs.com/package/monodeploy)
[![npm downloads](https://img.shields.io/npm/dm/monodeploy.svg)](https://npm-stat.com/charts.html?package=monodeploy)


A powerful CLI tool to simplify publishing packages from a monorepo using yarn workspaces.

## Getting Started

### Prerequisites

Requires:
- Node v14.15.0+
- Yarn Berry

### Getting Started

In the root of your monorepo:

```sh
yarn add --dev monodeploy
```

and then in CI:

```sh
yarn monodeploy
```

For help:

```sh
yarn monodeploy --help
```

### Migrating From Lerna

If migrating from lerna, you'll need to make some changes to your monorepo's root package.json:

- Set `"private": true`
- Set `"workspaces": ["packages/*"]` (you can use a different glob to match your monorepo layout)

### Configuration

#### Publish Registry

In your monorepo's root package.json, add:

```
"publishConfig": {
    "registry": "https://registry.npmjs.org/"
},
```

## Contributing

See the [Contributing Guide](./CONTRIBUTING.md).

## Contributors

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="http://msrose.github.io"><img src="https://avatars3.githubusercontent.com/u/3495264?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Michael Rose</b></sub></a><br /><a href="https://github.com/tophat/monodeploy/commits?author=msrose" title="Code">💻</a> <a href="https://github.com/tophat/monodeploy/commits?author=msrose" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://github.com/thebrendan"><img src="https://avatars1.githubusercontent.com/u/48444889?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Brendan Hall-Hern</b></sub></a><br /><a href="https://github.com/tophat/monodeploy/commits?author=thebrendan" title="Code">💻</a></td>
    <td align="center"><a href="https://opensource.tophat.com"><img src="https://avatars0.githubusercontent.com/u/6020693?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Shouvik DCosta</b></sub></a><br /><a href="https://github.com/tophat/monodeploy/commits?author=sdcosta" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/maryampaz"><img src="https://avatars1.githubusercontent.com/u/30090413?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Maryam Pazirandeh</b></sub></a><br /><a href="#design-maryampaz" title="Design">🎨</a></td>
    <td align="center"><a href="https://jakebolam.com"><img src="https://avatars2.githubusercontent.com/u/3534236?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Jake Bolam</b></sub></a><br /><a href="https://github.com/tophat/monodeploy/commits?author=jakebolam" title="Documentation">📖</a></td>
    <td align="center"><a href="http://emmanuel.ogbizi.com"><img src="https://avatars0.githubusercontent.com/u/2528959?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Emmanuel Ogbizi</b></sub></a><br /><a href="https://github.com/tophat/monodeploy/pulls?q=is%3Apr+reviewed-by%3Aiamogbz" title="Reviewed Pull Requests">👀</a></td>
    <td align="center"><a href="https://github.com/lime-green"><img src="https://avatars0.githubusercontent.com/u/9436142?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Josh DM</b></sub></a><br /><a href="https://github.com/tophat/monodeploy/commits?author=lime-green" title="Code">💻</a> <a href="#infra-lime-green" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/AnvarGazizovTH"><img src="https://avatars1.githubusercontent.com/u/69803154?v=4?s=100" width="100px;" alt=""/><br /><sub><b>AnvarGazizovTH</b></sub></a><br /><a href="#infra-AnvarGazizovTH" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="#tool-AnvarGazizovTH" title="Tools">🔧</a> <a href="https://github.com/tophat/monodeploy/commits?author=AnvarGazizovTH" title="Code">💻</a></td>
    <td align="center"><a href="https://noahnu.com/"><img src="https://avatars0.githubusercontent.com/u/1297096?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Noah</b></sub></a><br /><a href="https://github.com/tophat/monodeploy/commits?author=noahnu" title="Code">💻</a> <a href="#infra-noahnu" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a></td>
    <td align="center"><a href="https://www.karnov.club/"><img src="https://avatars2.githubusercontent.com/u/6210361?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Marc Cataford</b></sub></a><br /><a href="https://github.com/tophat/monodeploy/commits?author=mcataford" title="Code">💻</a> <a href="#infra-mcataford" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a></td>
  </tr>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!

## Credits

Special thanks to [Carol Skelly](https://github.com/iatek) for donating the 'tophat' GitHub organization.
