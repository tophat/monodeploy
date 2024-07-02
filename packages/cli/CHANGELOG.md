# Changelog

<!-- MONODEPLOY:BELOW -->

## [5.0.2](https://github.com/tophat/monodeploy/compare/monodeploy@5.0.1...monodeploy@5.0.2) "monodeploy" (2024-07-02)<a name="5.0.2"></a>

### Dependencies

* update yarn ([38800c8](https://github.com/tophat/monodeploy/commits/38800c8))
* update yarn to 4.3.1 (#905) ([38800c8](https://github.com/tophat/monodeploy/commits/38800c8))




## [5.0.1](https://github.com/tophat/monodeploy/compare/monodeploy@5.0.0...monodeploy@5.0.1) "monodeploy" (2023-11-14)<a name="5.0.1"></a>

### Dependencies

* update dependency @types/jest to ^29.5.6 (#874) ([dd726bd](https://github.com/tophat/monodeploy/commits/dd726bd))
* update node.js to >=18.18.2 (#889) ([5b1880b](https://github.com/tophat/monodeploy/commits/5b1880b))
* update to yarn 4.0.2 (#899) ([a2c3491](https://github.com/tophat/monodeploy/commits/a2c3491))




## [5.0.0](https://github.com/tophat/monodeploy/compare/monodeploy@4.3.0...monodeploy@5.0.0) "monodeploy" (2023-11-09)<a name="5.0.0"></a>

### Breaking Changes

* Monodeploy now requires Yarn v4.0.1+, minimum Node 18+. ([7624e61](https://github.com/tophat/monodeploy/commits/7624e61))
* Remove deprecated '--no-registry' CLI flag. Use '--registry-mode=manifest' instead. ([e98f9c0](https://github.com/tophat/monodeploy/commits/e98f9c0))

### Bug Fixes

* remove deprecated registry CLI flag (#864) ([e98f9c0](https://github.com/tophat/monodeploy/commits/e98f9c0))

### Dependencies

* update dependency @yarnpkg/core to ^3.5.4 (#854) ([78a2c9d](https://github.com/tophat/monodeploy/commits/78a2c9d))
* update dependency @types/node to ^18.18.3 (#857) ([4b7eb4a](https://github.com/tophat/monodeploy/commits/4b7eb4a))
* update dependency jest to ^29.7.0 (#858) ([32c7dd8](https://github.com/tophat/monodeploy/commits/32c7dd8))
* update internal dependencies (#871) ([44097c8](https://github.com/tophat/monodeploy/commits/44097c8))

### Features

* update to Yarn v4 ([7624e61](https://github.com/tophat/monodeploy/commits/7624e61))
* update to Yarn 4 (#840) ([7624e61](https://github.com/tophat/monodeploy/commits/7624e61))




## [4.3.0](https://github.com/tophat/monodeploy/compare/monodeploy@4.2.0...monodeploy@4.3.0) "monodeploy" (2023-09-05)<a name="4.3.0"></a>

### Bug Fixes

* add log level to the monodeploy configuration ([e50d53f](https://github.com/tophat/monodeploy/commits/e50d53f))
* add log level to the monodeploy configuration (#823) ([e50d53f](https://github.com/tophat/monodeploy/commits/e50d53f))

### Dependencies

* update dependency jest to ^29.6.2 (#810) ([4566664](https://github.com/tophat/monodeploy/commits/4566664))
* update dependency typanion to ^3.13.0 (#811) ([e0e44e7](https://github.com/tophat/monodeploy/commits/e0e44e7))
* accept minor and patch updates (#817) ([ca86dd6](https://github.com/tophat/monodeploy/commits/ca86dd6))

### Features

* update yarn target to v3.6.3 (#816) ([c56c619](https://github.com/tophat/monodeploy/commits/c56c619))
* introduce minimumStrategy config option ([4de51d8](https://github.com/tophat/monodeploy/commits/4de51d8))
* support clearing changesetIgnorePatterns from cli ([6e823ee](https://github.com/tophat/monodeploy/commits/6e823ee))




## [4.2.0](https://github.com/tophat/monodeploy/compare/monodeploy@4.1.0...monodeploy@4.2.0) "monodeploy" (2023-07-20)<a name="4.2.0"></a>

### Dependencies

* update dependency @types/jest to ^29.5.2 (#769) ([38b8611](https://github.com/tophat/monodeploy/commits/38b8611))
* update dependency clipanion to ^3.2.1 (#773) ([50ee75a](https://github.com/tophat/monodeploy/commits/50ee75a))




## [4.1.0](https://github.com/tophat/monodeploy/compare/monodeploy@4.0.1...monodeploy@4.1.0) "monodeploy" (2023-06-19)<a name="4.1.0"></a>

### Dependencies

* update dependency @types/jest to ^29.5.1 (#714) ([cda20e1](https://github.com/tophat/monodeploy/commits/cda20e1))

### Features

* target Yarn@3.6.0 ([059a693](https://github.com/tophat/monodeploy/commits/059a693))
* target Yarn@3.6.0 (#765) ([059a693](https://github.com/tophat/monodeploy/commits/059a693))




## [4.0.1](https://github.com/tophat/monodeploy/compare/monodeploy@4.0.0...monodeploy@4.0.1) "monodeploy" (2023-05-02)<a name="4.0.1"></a>

### Dependencies

* target Yarn 3.5.1 (#701) ([0e17f0d](https://github.com/tophat/monodeploy/commits/0e17f0d))




## [4.0.0](https://github.com/tophat/monodeploy/compare/monodeploy@3.9.0...monodeploy@4.0.0) "monodeploy" (2023-04-17)<a name="4.0.0"></a>

### Breaking Changes

* Min. node version is now v16. ([a04b0d9](https://github.com/tophat/monodeploy/commits/a04b0d9))
* The prependChangelog option has been removed in favour of changelogFilename. prependChangelog has previously been deprecated. ([e425eac](https://github.com/tophat/monodeploy/commits/e425eac))
* Use registryMode=manifest instead of noRegistry. ([4547082](https://github.com/tophat/monodeploy/commits/4547082))

### Bug Fixes

* drop the prependChangelog CLI argument in favour of changelogFilename ([e425eac](https://github.com/tophat/monodeploy/commits/e425eac))
* remove noRegistry option in favour of registryMode ([4547082](https://github.com/tophat/monodeploy/commits/4547082))

### Features

* raise minimum Node version to v16 (#661) ([a04b0d9](https://github.com/tophat/monodeploy/commits/a04b0d9))




## [3.9.0](https://github.com/tophat/monodeploy/compare/monodeploy@3.8.0...monodeploy@3.9.0) "monodeploy" (2023-04-04)<a name="3.9.0"></a>

### Dependencies

* update dependency ajv to ^8.12.0 (#639) ([2f69854](https://github.com/tophat/monodeploy/commits/2f69854))
* update node.js to >=v14.21.3 (#656) ([d7711ab](https://github.com/tophat/monodeploy/commits/d7711ab))

### Features

* add versionStrategy config (#659) ([cb551d8](https://github.com/tophat/monodeploy/commits/cb551d8))




## [3.8.0](https://github.com/tophat/monodeploy/compare/monodeploy@3.7.5...monodeploy@3.8.0) "monodeploy" (2023-03-28)<a name="3.8.0"></a>

### Dependencies

* **dev**: update jest dev dependency ([1909076](https://github.com/tophat/monodeploy/commits/1909076))

### Features

* target yarn 3.5.0 ([e62613d](https://github.com/tophat/monodeploy/commits/e62613d))




## [3.7.4](https://github.com/tophat/monodeploy/compare/monodeploy@3.7.3...monodeploy@3.7.4) "monodeploy" (2023-03-10)<a name="3.7.4"></a>

### Bug Fixes

* re-release monodeploy due to missing lib dirs (#623) ([b51c88c](https://github.com/tophat/monodeploy/commits/b51c88c))




## [3.7.3](https://github.com/tophat/monodeploy/compare/monodeploy@3.7.2...monodeploy@3.7.3) "monodeploy" (2023-03-10)<a name="3.7.3"></a>

### Dependencies

* update NodeJS version used in development to v18 ([74da880](https://github.com/tophat/monodeploy/commits/74da880))
* update to stable clipanion dependency (#613) ([9ec0d7e](https://github.com/tophat/monodeploy/commits/9ec0d7e))




## [3.7.0](https://github.com/tophat/monodeploy/compare/monodeploy@3.6.0...monodeploy@3.7.0) "monodeploy" (2023-02-14)<a name="3.7.0"></a>

### Features

* update yarn to 3.4.1 (#590) ([217aaa9](https://github.com/tophat/monodeploy/commits/217aaa9))




## [3.6.0](https://github.com/tophat/monodeploy/compare/monodeploy@3.5.0...monodeploy@3.6.0) "monodeploy" (2023-01-03)<a name="3.6.0"></a>

### Features

* target yarn 3.3.1 (#589) ([f3bd3bc](https://github.com/tophat/monodeploy/commits/f3bd3bc))




## [3.5.0](https://github.com/tophat/monodeploy/compare/monodeploy@3.4.0...monodeploy@3.5.0) "monodeploy" (2022-11-30)<a name="3.5.0"></a>

### Dependencies

* update dependency clipanion to ^3.2.0-rc.13 (#537) ([caa2968](https://github.com/tophat/monodeploy/commits/caa2968))

### Features

* target yarn v3.3.0 ([0f1248e](https://github.com/tophat/monodeploy/commits/0f1248e))
* target yarn v3.3.0 (#576) ([0f1248e](https://github.com/tophat/monodeploy/commits/0f1248e))




## [3.3.1](https://github.com/tophat/monodeploy/compare/monodeploy@3.3.0...monodeploy@3.3.1) "monodeploy" (2022-10-13)<a name="3.3.1"></a>

### Bug Fixes

* update to yarn 3.2.3 (#513) ([a6e8030](https://github.com/tophat/monodeploy/commits/a6e8030))
* update to yarn 3.2.4 ([6aebff9](https://github.com/tophat/monodeploy/commits/6aebff9))




## [3.3.0](https://github.com/tophat/monodeploy/compare/monodeploy@3.2.0...monodeploy@3.3.0) "monodeploy" (2022-08-11)<a name="3.3.0"></a>

### Observability & Analytics

* improved logging ([e517337](https://github.com/tophat/monodeploy/commits/e517337))




## [3.2.0](https://github.com/tophat/monodeploy/compare/monodeploy@3.1.0...monodeploy@3.2.0) "monodeploy" (2022-08-01)<a name="3.2.0"></a>

### Features

* build against Yarn 3.2.2 (#506) ([11d117c](https://github.com/tophat/monodeploy/commits/11d117c))




## [3.1.0](https://github.com/tophat/monodeploy/compare/monodeploy@3.0.2...monodeploy@3.1.0) "monodeploy" (2022-07-03)<a name="3.1.0"></a>

### Features

* add registryMode option, deprecated noRegistry ([6945cdb](https://github.com/tophat/monodeploy/commits/6945cdb))




## [3.1.0](https://github.com/tophat/monodeploy/compare/monodeploy@3.0.2...monodeploy@3.1.0) "monodeploy" (2022-07-03)<a name="3.1.0"></a>

### Features

* add registryMode option, deprecated noRegistry ([6945cdb](https://github.com/tophat/monodeploy/commits/6945cdb))




## [3.0.1](https://github.com/tophat/monodeploy/compare/monodeploy@3.0.0...monodeploy@3.0.1) "monodeploy" (2022-05-26)<a name="3.0.1"></a>

### Bug Fixes

* remove strict tuples config parser warning (#490) ([99ef764](https://github.com/tophat/monodeploy/commits/99ef764))
* target yarn 3.2.1 (#495) ([e13073f](https://github.com/tophat/monodeploy/commits/e13073f))




## [3.0.0](https://github.com/tophat/monodeploy/compare/monodeploy@2.8.21...monodeploy@3.0.0) "monodeploy" (2022-04-10)<a name="3.0.0"></a>

### Breaking Changes

* Array CLI argument syntax has changed due to the migration from yargs to clipanion. Instead of '--plugins plugin-a plugin-b', the new syntax is to specify the cli flag per item to yield '--plugins plugin-a --plugins plugin-b'. ([add912b](https://github.com/tophat/monodeploy/commits/add912b))

### Bug Fixes

* prereleaseNPMTag cli argument was not being read ([add912b](https://github.com/tophat/monodeploy/commits/add912b))
* compatibility with yarn 3.2.0, update dependencies (#474) ([ba475a5](https://github.com/tophat/monodeploy/commits/ba475a5))

### Features

* support grouping packages similar to lerna fixed mode #415 (#453) ([1e8711a](https://github.com/tophat/monodeploy/commits/1e8711a))
* migrate from yargs to clipanion (#454) ([add912b](https://github.com/tophat/monodeploy/commits/add912b))
* support for config presets ([5ae6c73](https://github.com/tophat/monodeploy/commits/5ae6c73))
* monodeploy will auto-detect your monodeploy.config.js file ([5ae6c73](https://github.com/tophat/monodeploy/commits/5ae6c73))
* support for config presets (#461) ([5ae6c73](https://github.com/tophat/monodeploy/commits/5ae6c73))
* deprecate --prepend-changelog in favour of --changelog-filename ([7e2dc3b](https://github.com/tophat/monodeploy/commits/7e2dc3b))
* add --apply-changeset cli flag ([7e2dc3b](https://github.com/tophat/monodeploy/commits/7e2dc3b))
* add support for plugin options (#484) ([07fbb70](https://github.com/tophat/monodeploy/commits/07fbb70))




## [2.8.13](https://github.com/tophat/monodeploy/compare/monodeploy@2.8.12...monodeploy@2.8.13) "monodeploy" (2021-10-25)<a name="2.8.13"></a>

### Bug Fixes

* update to yarn 3.1.0 (#440) ([5eb4ad0](https://github.com/tophat/monodeploy/commits/5eb4ad0))




## [2.8.12](https://github.com/tophat/monodeploy/compare/monodeploy@2.8.11...monodeploy@2.8.12) "monodeploy" (2021-10-11)<a name="2.8.12"></a>

### Bug Fixes

* update internal yarn dependencies (#433) ([a8d6fcb](https://github.com/tophat/monodeploy/commits/a8d6fcb))
* use cross platform exec for windows support (#434) ([3dcbfb4](https://github.com/tophat/monodeploy/commits/3dcbfb4))
* support windows (#431) ([8a42a96](https://github.com/tophat/monodeploy/commits/8a42a96))




## [2.8.11](https://github.com/tophat/monodeploy/compare/monodeploy@2.8.10...monodeploy@2.8.11) "monodeploy" (2021-09-15)<a name="2.8.11"></a>

### Bug Fixes

* update yarn dependencies (#429) ([03a82b7](https://github.com/tophat/monodeploy/commits/03a82b7))




## [2.8.1](https://github.com/tophat/monodeploy/compare/monodeploy@2.8.0...monodeploy@2.8.1) "monodeploy" (2021-07-26)<a name="2.8.1"></a>

### Bug Fixes

* update to yarn v3.0.0 ([c40a226](https://github.com/tophat/monodeploy/commits/c40a226))
* update to yarn v3.0.0 (#414) ([c40a226](https://github.com/tophat/monodeploy/commits/c40a226))




## [2.8.0](https://github.com/tophat/monodeploy/compare/monodeploy@2.7.8...monodeploy@2.8.0) "monodeploy" (2021-07-26)<a name="2.8.0"></a>

### Features

* add commit ignore patterns config option (#413) ([7f503c4](https://github.com/tophat/monodeploy/commits/7f503c4))




## [2.7.8](https://github.com/tophat/monodeploy/compare/monodeploy@2.7.7...monodeploy@2.7.8) "monodeploy" (2021-07-15)<a name="2.7.8"></a>

### Bug Fixes

* add 'infer' access option to provide backwards compatibility (#407) ([3f466ee](https://github.com/tophat/monodeploy/commits/3f466ee))




## [2.7.3](https://github.com/tophat/monodeploy/compare/monodeploy@2.7.2...monodeploy@2.7.3) "monodeploy" (2021-07-09)<a name="2.7.3"></a>

### Bug Fixes

* consider `prerelease` flag from config file ([13a2904](https://github.com/tophat/monodeploy/commits/13a2904))
* handle cli and config file precedence correctly ([13a2904](https://github.com/tophat/monodeploy/commits/13a2904))




## [2.7.1](https://github.com/tophat/monodeploy/compare/monodeploy@2.7.0...monodeploy@2.7.1) "monodeploy" (2021-07-05)<a name="2.7.1"></a>

### Bug Fixes

* update yarn to 3.0.0-rc.9 (#386) ([fcfc63a](https://github.com/tophat/monodeploy/commits/fcfc63a))




## [2.7.0](https://github.com/tophat/monodeploy/compare/monodeploy@2.6.5...monodeploy@2.7.0) "monodeploy" (2021-07-05)<a name="2.7.0"></a>

### Bug Fixes

* use and support repository url with subdirectories (#384) ([a5c703e](https://github.com/tophat/monodeploy/commits/a5c703e))

### Features

* add prerelease config options ([a5c703e](https://github.com/tophat/monodeploy/commits/a5c703e))
* add prerelease config options (#375) ([a5c703e](https://github.com/tophat/monodeploy/commits/a5c703e))
* pre-release support, close #292 ([a5c703e](https://github.com/tophat/monodeploy/commits/a5c703e))




## [2.6.3](https://github.com/tophat/monodeploy/compare/monodeploy@2.6.2...monodeploy@2.6.3) "monodeploy" (2021-06-11)<a name="2.6.3"></a>

### Bug Fixes

* preserve workspace protocol when persisting package.json to disk ([b2d532d](https://github.com/tophat/monodeploy/commits/b2d532d))
* preserve workspace protocol when persisting package.json to disk (#359) ([b2d532d](https://github.com/tophat/monodeploy/commits/b2d532d))




## [2.6.0](https://github.com/tophat/monodeploy/compare/monodeploy@2.5.6...monodeploy@2.6.0) "monodeploy" (2021-06-06)<a name="2.6.0"></a>

### Features

* add changeset ignore patterns support (#353) ([9f5fec6](https://github.com/tophat/monodeploy/commits/9f5fec6))




## [2.5.6](https://github.com/tophat/monodeploy/compare/monodeploy@2.5.5...monodeploy@2.5.6) "monodeploy" (2021-06-06)<a name="2.5.6"></a>

### Performance Improvements

* update yarn dependencies ([ef6f096](https://github.com/tophat/monodeploy/commits/ef6f096))
* update yarn dependencies (#348) ([ef6f096](https://github.com/tophat/monodeploy/commits/ef6f096))




## [2.5.5](https://github.com/tophat/monodeploy/compare/monodeploy@2.5.4...monodeploy@2.5.5) "monodeploy" (2021-06-02)<a name="2.5.5"></a>



## [2.4.6](https://github.com/tophat/monodeploy/compare/monodeploy@2.4.5...monodeploy@2.4.6) "monodeploy" (2021-05-06)<a name="2.4.6"></a>



## [2.4.5](https://github.com/tophat/monodeploy/compare/monodeploy@2.4.4...monodeploy@2.4.5) "monodeploy" (2021-05-06)<a name="2.4.5"></a>



## [2.4.4](https://github.com/tophat/monodeploy/compare/monodeploy@2.4.3...monodeploy@2.4.4) "monodeploy" (2021-05-01)<a name="2.4.4"></a>

### Bug Fixes

* specify minimum supported node version (#328) ([cd09870](https://github.com/tophat/monodeploy/commits/cd09870))




## [2.4.3](https://github.com/tophat/monodeploy/compare/monodeploy@2.4.2...monodeploy@2.4.3) "monodeploy" (2021-05-01)<a name="2.4.3"></a>


## [2.4.1](https://github.com/tophat/monodeploy/compare/monodeploy@2.4.0...monodeploy@2.4.1) "monodeploy" (2021-04-28)<a name="2.4.1"></a>


## [2.4.0](https://github.com/tophat/monodeploy/compare/monodeploy@2.3.11...monodeploy@2.4.0) "monodeploy" (2021-04-28)<a name="2.4.0"></a>

### Features

* **cli**: add network concurrency options to limit concurrent publishes ([#319](https://github.com/tophat/monodeploy/issues/319)) ([db84fc7](https://github.com/tophat/monodeploy/commits/db84fc7))
* **cli**: add no-git-tag option to disable git tagging ([#320](https://github.com/tophat/monodeploy/issues/320)) ([db84fc7](https://github.com/tophat/monodeploy/commits/db84fc7))


## [2.3.11](https://github.com/tophat/monodeploy/compare/monodeploy@2.3.10...monodeploy@2.3.11) "monodeploy" (2021-04-27)<a name="2.3.11"></a>


## [2.3.10](https://github.com/tophat/monodeploy/compare/monodeploy@2.3.9...monodeploy@2.3.10) "monodeploy" (2021-04-26)<a name="2.3.10"></a>


## [2.3.9](https://github.com/tophat/monodeploy/compare/monodeploy@2.3.8...monodeploy@2.3.9) "monodeploy" (2021-04-26)<a name="2.3.9"></a>


## [2.3.8](https://github.com/tophat/monodeploy/compare/monodeploy@2.3.7...monodeploy@2.3.8) "monodeploy" (2021-04-23)<a name="2.3.8"></a>


## [2.3.7](https://github.com/tophat/monodeploy/compare/monodeploy@2.3.6...monodeploy@2.3.7) "monodeploy" (2021-04-23)<a name="2.3.7"></a>

### Bug Fixes

* **cli:** add config file schema validation ([#308](https://github.com/tophat/monodeploy/issues/308)) ([c768cf1](https://github.com/tophat/monodeploy/commits/c768cf1))


## [2.3.6](https://github.com/tophat/monodeploy/compare/monodeploy@2.3.5...monodeploy@2.3.6) "monodeploy" (2021-04-13)<a name="2.3.6"></a>


## [2.3.5](https://github.com/tophat/monodeploy/compare/monodeploy@2.3.4...monodeploy@2.3.5) "monodeploy" (2021-04-12)<a name="2.3.5"></a>


## [2.3.4](https://github.com/tophat/monodeploy/compare/monodeploy@2.3.3...monodeploy@2.3.4) "monodeploy" (2021-04-12)<a name="2.3.4"></a>

### Bug Fixes

* **node:** skip incompatible plugins ([#303](https://github.com/tophat/monodeploy/issues/303)) ([ba80bae](https://github.com/tophat/monodeploy/commits/ba80bae))


## [2.3.3](https://github.com/tophat/monodeploy/compare/monodeploy@2.3.2...monodeploy@2.3.3) "monodeploy" (2021-04-09)<a name="2.3.3"></a>


## [2.3.2](https://github.com/tophat/monodeploy/compare/monodeploy@2.3.1...monodeploy@2.3.2) "monodeploy" (2021-04-09)<a name="2.3.2"></a>

### Bug Fixes

* **publish:** upload to npm the most recent package manifest ([#299](https://github.com/tophat/monodeploy/issues/299)) ([4fb8f46](https://github.com/tophat/monodeploy/commits/4fb8f46))


## [2.3.1](https://github.com/tophat/monodeploy/compare/monodeploy@2.3.0...monodeploy@2.3.1) "monodeploy" (2021-04-08)<a name="2.3.1"></a>

### Bug Fixes

* **cli:** resolve config file relative to cwd, close [#297](https://github.com/tophat/monodeploy/issues/297) ([#298](https://github.com/tophat/monodeploy/issues/298)) ([b81ce4a](https://github.com/tophat/monodeploy/commits/b81ce4a))


## [2.3.0](https://github.com/tophat/monodeploy/compare/monodeploy@2.2.1...monodeploy@2.3.0) "monodeploy" (2021-04-07)<a name="2.3.0"></a>

### Bug Fixes

* **cli:** allow config file to override boolean flags ([#295](https://github.com/tophat/monodeploy/issues/295)) ([ad1fe9b](https://github.com/tophat/monodeploy/commits/ad1fe9b))

### Features

* **cli:** add configuration file support, close [#281](https://github.com/tophat/monodeploy/issues/281) ([#294](https://github.com/tophat/monodeploy/issues/294)) ([ad1fe9b](https://github.com/tophat/monodeploy/commits/ad1fe9b))
* add config option to skip registry reads and writes ([#296](https://github.com/tophat/monodeploy/issues/296)) ([ad1fe9b](https://github.com/tophat/monodeploy/commits/ad1fe9b))


## [2.2.1](https://github.com/tophat/monodeploy/compare/monodeploy@2.2.0...monodeploy@2.2.1) "monodeploy" (2021-03-10)<a name="2.2.1"></a>

### Bug Fixes

* bump versions to release ([#284](https://github.com/tophat/monodeploy/issues/284)) ([dc93dcf](https://github.com/tophat/monodeploy/commits/dc93dcf))


## [2.2.0](https://github.com/tophat/monodeploy/compare/monodeploy@2.1.1...monodeploy@2.2.0) "monodeploy" (2021-03-08)<a name="2.2.0"></a>

### Features

* add topological sort, support for previewing changes ([#273](https://github.com/tophat/monodeploy/issues/273)) ([87b6a00](https://github.com/tophat/monodeploy/commits/87b6a00))
* rename private monodeploy packages for improved readability under scope ([#277](https://github.com/tophat/monodeploy/issues/277)) ([87b6a00](https://github.com/tophat/monodeploy/commits/87b6a00))
