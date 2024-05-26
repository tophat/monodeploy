# ⚠️ DEPRECATION NOTICE

> Monodeploy has been replaced by [Monoweave](https://github.com/monoweave/monoweave). Monoweave supports all the functionality of monodeploy, with additional features, bug fixes, and continued development.

# monodeploy

<span><img align="right" width="200" height="200" src="./assets/monodeploy.svg" alt="monodeploy"></span>

[![Continuous Integration](https://github.com/tophat/monodeploy/workflows/Continuous%20Integration/badge.svg?branch=main)](https://github.com/tophat/monodeploy/actions?query=workflow%3A%22Continuous+Integration%22)
[![codecov](https://codecov.io/gh/tophat/monodeploy/branch/main/graph/badge.svg)](https://codecov.io/gh/tophat/monodeploy)
[![Maturity badge - level 2](https://img.shields.io/badge/Maturity-Level%202%20--%20First%20Release-yellowgreen.svg)](https://github.com/tophat/getting-started/blob/main/scorecard.md)
[![GitHub license](https://img.shields.io/github/license/tophat/monodeploy)](https://github.com/tophat/monodeploy/blob/main/LICENSE)
[![Discord](https://img.shields.io/discord/809577721751142410)](https://discord.gg/YhK3GFcZrk) <!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-16-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->

![node-current](https://img.shields.io/node/v/monodeploy)
[![npm](https://img.shields.io/npm/v/monodeploy.svg)](https://www.npmjs.com/package/monodeploy)
[![npm downloads](https://img.shields.io/npm/dm/monodeploy.svg)](https://npm-stat.com/charts.html?package=monodeploy)


Monodeploy is a powerful tool which aims to simplify the package publishing process for monorepos. It leverages [Yarn Berry workspaces](https://yarnpkg.com/features/workspaces) to do the heavy lifting, and is a direct replacement for tools such as [Lerna](https://github.com/lerna/lerna) and [Semantic Release](https://github.com/semantic-release/semantic-release).

Monodeploy only supports projects using Yarn Modern v4+ with the minimum node version set to Node v18.12.0.

Please see the [Monodeploy Website](https://tophat.github.io/monodeploy) for information on how to get started with Monodeploy.

### Note About Monodeploy Package Versioning

Only the `monodeploy` package is "public" and follows strict semantic versioning. The other packages such as `@monodeploy/changelog` are meant for internal use and may change their APIs at any time.

## Contributing

See the [Contributing Guide](https://tophat.github.io/monodeploy/contributing) for setup instructions, tips, and guidelines.

## Contributors

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="http://msrose.github.io"><img src="https://avatars3.githubusercontent.com/u/3495264?v=4?s=100" width="100px;" alt="Michael Rose"/><br /><sub><b>Michael Rose</b></sub></a><br /><a href="https://github.com/tophat/monodeploy/commits?author=msrose" title="Code">💻</a> <a href="https://github.com/tophat/monodeploy/commits?author=msrose" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/thebrendan"><img src="https://avatars1.githubusercontent.com/u/48444889?v=4?s=100" width="100px;" alt="Brendan Hall-Hern"/><br /><sub><b>Brendan Hall-Hern</b></sub></a><br /><a href="https://github.com/tophat/monodeploy/commits?author=thebrendan" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://opensource.tophat.com"><img src="https://avatars0.githubusercontent.com/u/6020693?v=4?s=100" width="100px;" alt="Shouvik DCosta"/><br /><sub><b>Shouvik DCosta</b></sub></a><br /><a href="https://github.com/tophat/monodeploy/commits?author=sdcosta" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/maryampaz"><img src="https://avatars1.githubusercontent.com/u/30090413?v=4?s=100" width="100px;" alt="Maryam Pazirandeh"/><br /><sub><b>Maryam Pazirandeh</b></sub></a><br /><a href="#design-maryampaz" title="Design">🎨</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://jakebolam.com"><img src="https://avatars2.githubusercontent.com/u/3534236?v=4?s=100" width="100px;" alt="Jake Bolam"/><br /><sub><b>Jake Bolam</b></sub></a><br /><a href="https://github.com/tophat/monodeploy/commits?author=jakebolam" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://emmanuel.ogbizi.com"><img src="https://avatars0.githubusercontent.com/u/2528959?v=4?s=100" width="100px;" alt="Emmanuel Ogbizi"/><br /><sub><b>Emmanuel Ogbizi</b></sub></a><br /><a href="https://github.com/tophat/monodeploy/pulls?q=is%3Apr+reviewed-by%3Aiamogbz" title="Reviewed Pull Requests">👀</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/lime-green"><img src="https://avatars0.githubusercontent.com/u/9436142?v=4?s=100" width="100px;" alt="Josh DM"/><br /><sub><b>Josh DM</b></sub></a><br /><a href="https://github.com/tophat/monodeploy/commits?author=lime-green" title="Code">💻</a> <a href="#infra-lime-green" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/AnvarGazizovTH"><img src="https://avatars1.githubusercontent.com/u/69803154?v=4?s=100" width="100px;" alt="AnvarGazizovTH"/><br /><sub><b>AnvarGazizovTH</b></sub></a><br /><a href="#infra-AnvarGazizovTH" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="#tool-AnvarGazizovTH" title="Tools">🔧</a> <a href="https://github.com/tophat/monodeploy/commits?author=AnvarGazizovTH" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://noahnu.com/"><img src="https://avatars0.githubusercontent.com/u/1297096?v=4?s=100" width="100px;" alt="Noah"/><br /><sub><b>Noah</b></sub></a><br /><a href="https://github.com/tophat/monodeploy/commits?author=noahnu" title="Code">💻</a> <a href="#infra-noahnu" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://www.karnov.club/"><img src="https://avatars2.githubusercontent.com/u/6210361?v=4?s=100" width="100px;" alt="Marc Cataford"/><br /><sub><b>Marc Cataford</b></sub></a><br /><a href="https://github.com/tophat/monodeploy/commits?author=mcataford" title="Code">💻</a> <a href="#infra-mcataford" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/fmal"><img src="https://avatars.githubusercontent.com/u/927591?v=4?s=100" width="100px;" alt="Filip Malinowski"/><br /><sub><b>Filip Malinowski</b></sub></a><br /><a href="https://github.com/tophat/monodeploy/commits?author=fmal" title="Code">💻</a> <a href="https://github.com/tophat/monodeploy/issues?q=author%3Afmal" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://www.ianmccaus.land"><img src="https://avatars.githubusercontent.com/u/20084398?v=4?s=100" width="100px;" alt="Ian McCausland"/><br /><sub><b>Ian McCausland</b></sub></a><br /><a href="https://github.com/tophat/monodeploy/commits?author=imccausl" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/EdieLemoine"><img src="https://avatars.githubusercontent.com/u/3886637?v=4?s=100" width="100px;" alt="Edie Lemoine"/><br /><sub><b>Edie Lemoine</b></sub></a><br /><a href="https://github.com/tophat/monodeploy/commits?author=EdieLemoine" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/dbasilio"><img src="https://avatars.githubusercontent.com/u/8311284?v=4?s=100" width="100px;" alt="Daniel Basilio"/><br /><sub><b>Daniel Basilio</b></sub></a><br /><a href="https://github.com/tophat/monodeploy/issues?q=author%3Adbasilio" title="Bug reports">🐛</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://papooch.github.io/"><img src="https://avatars.githubusercontent.com/u/46406259?v=4?s=100" width="100px;" alt="Ondřej Švanda"/><br /><sub><b>Ondřej Švanda</b></sub></a><br /><a href="https://github.com/tophat/monodeploy/commits?author=Papooch" title="Code">💻</a> <a href="https://github.com/tophat/monodeploy/commits?author=Papooch" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://dra.pe"><img src="https://avatars.githubusercontent.com/u/539437?v=4?s=100" width="100px;" alt="Shawn Drape"/><br /><sub><b>Shawn Drape</b></sub></a><br /><a href="https://github.com/tophat/monodeploy/commits?author=shawndrape" title="Documentation">📖</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!

## Credits

Special thanks to [Carol Skelly](https://github.com/iatek) for donating the 'tophat' GitHub organization.
