# Changelog

<!-- MONODEPLOY:BELOW -->

## [3.7.4](https://github.com/tophat/monodeploy/compare/@monodeploy/changelog@3.7.3...@monodeploy/changelog@3.7.4) "@monodeploy/changelog" (2023-03-10)<a name="3.7.4"></a>

### Bug Fixes

* re-release monodeploy due to missing lib dirs (#623) ([b51c88c](https://github.com/tophat/monodeploy/commits/b51c88c))




## [3.7.3](https://github.com/tophat/monodeploy/compare/@monodeploy/changelog@3.7.2...@monodeploy/changelog@3.7.3) "@monodeploy/changelog" (2023-03-10)<a name="3.7.3"></a>

### Bug Fixes

* ensures changelog files are up to date before adding entries (#610) ([c5a3460](https://github.com/tophat/monodeploy/commits/c5a3460))

### Dependencies

* update dependency @types/conventional-changelog-writer to ^4.0.2 (#598) ([65e0f2f](https://github.com/tophat/monodeploy/commits/65e0f2f))
* update dependency @types/conventional-commits-parser to ^3.0.3 (#599) ([d15f493](https://github.com/tophat/monodeploy/commits/d15f493))
* update NodeJS version used in development to v18 ([74da880](https://github.com/tophat/monodeploy/commits/74da880))




## [3.7.0](https://github.com/tophat/monodeploy/compare/@monodeploy/changelog@3.6.0...@monodeploy/changelog@3.7.0) "@monodeploy/changelog" (2023-02-14)<a name="3.7.0"></a>

### Features

* update yarn to 3.4.1 (#590) ([217aaa9](https://github.com/tophat/monodeploy/commits/217aaa9))




## [3.6.0](https://github.com/tophat/monodeploy/compare/@monodeploy/changelog@3.5.0...@monodeploy/changelog@3.6.0) "@monodeploy/changelog" (2023-01-03)<a name="3.6.0"></a>

### Features

* target yarn 3.3.1 (#589) ([f3bd3bc](https://github.com/tophat/monodeploy/commits/f3bd3bc))




## [3.5.0](https://github.com/tophat/monodeploy/compare/@monodeploy/changelog@3.4.0...@monodeploy/changelog@3.5.0) "@monodeploy/changelog" (2022-11-30)<a name="3.5.0"></a>

### Features

* target yarn v3.3.0 ([0f1248e](https://github.com/tophat/monodeploy/commits/0f1248e))
* target yarn v3.3.0 (#576) ([0f1248e](https://github.com/tophat/monodeploy/commits/0f1248e))




## [3.3.1](https://github.com/tophat/monodeploy/compare/@monodeploy/changelog@3.3.0...@monodeploy/changelog@3.3.1) "@monodeploy/changelog" (2022-10-13)<a name="3.3.1"></a>

### Bug Fixes

* update to yarn 3.2.3 (#513) ([a6e8030](https://github.com/tophat/monodeploy/commits/a6e8030))
* update to yarn 3.2.4 ([6aebff9](https://github.com/tophat/monodeploy/commits/6aebff9))




## [3.2.0](https://github.com/tophat/monodeploy/compare/@monodeploy/changelog@3.1.0...@monodeploy/changelog@3.2.0) "@monodeploy/changelog" (2022-08-01)<a name="3.2.0"></a>

### Features

* build against Yarn 3.2.2 (#506) ([11d117c](https://github.com/tophat/monodeploy/commits/11d117c))




## [3.0.1](https://github.com/tophat/monodeploy/compare/@monodeploy/changelog@3.0.0...@monodeploy/changelog@3.0.1) "@monodeploy/changelog" (2022-05-26)<a name="3.0.1"></a>

### Bug Fixes

* target yarn 3.2.1 (#495) ([e13073f](https://github.com/tophat/monodeploy/commits/e13073f))




## [3.0.0](https://github.com/tophat/monodeploy/compare/@monodeploy/changelog@0.7.13...@monodeploy/changelog@3.0.0) "@monodeploy/changelog" (2022-04-10)<a name="3.0.0"></a>

### Breaking Changes

* Monodeploy no longer tags the commit containing the code changes, but rather tags the later commit which contains the package.json changes and other publish artifacts. This is more inline with how Lerna operates and means the tag will match the version in the package.json, as well as the changelog files. If there is interest in adding back the old behaviour behind a configuration option, please open a GitHub issue. ([559de51](https://github.com/tophat/monodeploy/commits/559de51))

### Bug Fixes

* inconsistent behaviour in experimental conventional config (#459) ([b6af42a](https://github.com/tophat/monodeploy/commits/b6af42a))
* compatibility with yarn 3.2.0, update dependencies (#474) ([ba475a5](https://github.com/tophat/monodeploy/commits/ba475a5))

### Features

* tag the same commit which includes publish artifacts, #402 (#452) ([559de51](https://github.com/tophat/monodeploy/commits/559de51))
* support grouping packages similar to lerna fixed mode #415 (#453) ([1e8711a](https://github.com/tophat/monodeploy/commits/1e8711a))
* deprecate --prepend-changelog in favour of --changelog-filename ([7e2dc3b](https://github.com/tophat/monodeploy/commits/7e2dc3b))
* add --apply-changeset cli flag ([7e2dc3b](https://github.com/tophat/monodeploy/commits/7e2dc3b))




## [0.7.9](https://github.com/tophat/monodeploy/compare/@monodeploy/changelog@0.7.8...@monodeploy/changelog@0.7.9) "@monodeploy/changelog" (2021-10-25)<a name="0.7.9"></a>

### Bug Fixes

* update to yarn 3.1.0 (#440) ([5eb4ad0](https://github.com/tophat/monodeploy/commits/5eb4ad0))




## [0.7.8](https://github.com/tophat/monodeploy/compare/@monodeploy/changelog@0.7.7...@monodeploy/changelog@0.7.8) "@monodeploy/changelog" (2021-10-11)<a name="0.7.8"></a>

### Bug Fixes

* update internal yarn dependencies (#433) ([a8d6fcb](https://github.com/tophat/monodeploy/commits/a8d6fcb))
* use cross platform exec for windows support (#434) ([3dcbfb4](https://github.com/tophat/monodeploy/commits/3dcbfb4))
* support windows (#431) ([8a42a96](https://github.com/tophat/monodeploy/commits/8a42a96))




## [0.7.7](https://github.com/tophat/monodeploy/compare/@monodeploy/changelog@0.7.6...@monodeploy/changelog@0.7.7) "@monodeploy/changelog" (2021-09-15)<a name="0.7.7"></a>

### Bug Fixes

* update yarn dependencies (#429) ([03a82b7](https://github.com/tophat/monodeploy/commits/03a82b7))




## [0.7.4](https://github.com/tophat/monodeploy/compare/@monodeploy/changelog@0.7.3...@monodeploy/changelog@0.7.4) "@monodeploy/changelog" (2021-08-13)<a name="0.7.4"></a>

### Bug Fixes

* bug where only the latest sha was being written in the changelog (#424) ([e7355fe](https://github.com/tophat/monodeploy/commits/e7355fe))




## [0.7.3](https://github.com/tophat/monodeploy/compare/@monodeploy/changelog@0.7.2...@monodeploy/changelog@0.7.3) "@monodeploy/changelog" (2021-07-26)<a name="0.7.3"></a>

### Bug Fixes

* update to yarn v3.0.0 ([c40a226](https://github.com/tophat/monodeploy/commits/c40a226))
* update to yarn v3.0.0 (#414) ([c40a226](https://github.com/tophat/monodeploy/commits/c40a226))




## [0.7.0](https://github.com/tophat/monodeploy/compare/@monodeploy/changelog@0.6.1...@monodeploy/changelog@0.7.0) "@monodeploy/changelog" (2021-07-12)<a name="0.7.0"></a>

### Features

* support custom configuration for conventional changelog config ([5312462](https://github.com/tophat/monodeploy/commits/5312462))




## [0.6.1](https://github.com/tophat/monodeploy/compare/@monodeploy/changelog@0.6.0...@monodeploy/changelog@0.6.1) "@monodeploy/changelog" (2021-07-09)<a name="0.6.1"></a>

### Bug Fixes

* support conventional changelog config factory functions (#396) ([13a2904](https://github.com/tophat/monodeploy/commits/13a2904))




## [0.6.0](https://github.com/tophat/monodeploy/compare/@monodeploy/changelog@0.5.9...@monodeploy/changelog@0.6.0) "@monodeploy/changelog" (2021-07-06)<a name="0.6.0"></a>

### Features

* expose strategy and previous version in changeset file (#387) ([f2e506b](https://github.com/tophat/monodeploy/commits/f2e506b))




## [0.5.9](https://github.com/tophat/monodeploy/compare/@monodeploy/changelog@0.5.8...@monodeploy/changelog@0.5.9) "@monodeploy/changelog" (2021-07-05)<a name="0.5.9"></a>

### Bug Fixes

* update yarn to 3.0.0-rc.9 (#386) ([fcfc63a](https://github.com/tophat/monodeploy/commits/fcfc63a))




## [0.5.8](https://github.com/tophat/monodeploy/compare/@monodeploy/changelog@0.5.7...@monodeploy/changelog@0.5.8) "@monodeploy/changelog" (2021-07-05)<a name="0.5.8"></a>

### Bug Fixes

* refactor APIs to support non-latest dist tag (#374) ([a5c703e](https://github.com/tophat/monodeploy/commits/a5c703e))
* use and support repository url with subdirectories (#384) ([a5c703e](https://github.com/tophat/monodeploy/commits/a5c703e))




## [0.5.7](https://github.com/tophat/monodeploy/compare/@monodeploy/changelog@0.5.6...@monodeploy/changelog@0.5.7) "@monodeploy/changelog" (2021-06-11)<a name="0.5.7"></a>

### Bug Fixes

* preserve workspace protocol when persisting package.json to disk ([b2d532d](https://github.com/tophat/monodeploy/commits/b2d532d))
* preserve workspace protocol when persisting package.json to disk (#359) ([b2d532d](https://github.com/tophat/monodeploy/commits/b2d532d))




## [0.5.5](https://github.com/tophat/monodeploy/compare/@monodeploy/changelog@0.5.4...@monodeploy/changelog@0.5.5) "@monodeploy/changelog" (2021-06-08)<a name="0.5.5"></a>

### Bug Fixes

* do not generate changelog for dependent packages (#357) ([48ed33a](https://github.com/tophat/monodeploy/commits/48ed33a))




## [0.5.4](https://github.com/tophat/monodeploy/compare/@monodeploy/changelog@0.5.3...@monodeploy/changelog@0.5.4) "@monodeploy/changelog" (2021-06-06)<a name="0.5.4"></a>

### Performance Improvements

* update yarn dependencies ([ef6f096](https://github.com/tophat/monodeploy/commits/ef6f096))
* update yarn dependencies (#348) ([ef6f096](https://github.com/tophat/monodeploy/commits/ef6f096))




## [0.5.3](https://github.com/tophat/monodeploy/compare/@monodeploy/changelog@0.5.2...@monodeploy/changelog@0.5.3) "@monodeploy/changelog" (2021-06-02)<a name="0.5.3"></a>



## [0.4.1](https://github.com/tophat/monodeploy/compare/@monodeploy/changelog@0.4.0...@monodeploy/changelog@0.4.1) "@monodeploy/changelog" (2021-05-06)<a name="0.4.1"></a>

### Bug Fixes

* **changelog**: only write to changelog file if there are changes (#330) ([22b5421](https://github.com/tophat/monodeploy/commits/22b5421))




## [0.4.0](https://github.com/tophat/monodeploy/compare/@monodeploy/changelog@0.3.2...@monodeploy/changelog@0.4.0) "@monodeploy/changelog" (2021-05-01)<a name="0.4.0"></a>

### Features

* support packageDir changelog token for per package changelogs ([cca2cfe](https://github.com/tophat/monodeploy/commits/cca2cfe))
* **changelog**: add per package changelog support (#321) ([cca2cfe](https://github.com/tophat/monodeploy/commits/cca2cfe))


## [0.3.2](https://github.com/tophat/monodeploy/compare/@monodeploy/changelog@0.3.1...@monodeploy/changelog@0.3.2) "@monodeploy/changelog" (2021-04-28)<a name="0.3.2"></a>

### Bug Fixes

* **changelog**: do not transform commits twice (#322) ([596da5c](https://github.com/tophat/monodeploy/commits/596da5c))


## [0.3.1](https://github.com/tophat/monodeploy/compare/@monodeploy/changelog@0.3.0...@monodeploy/changelog@0.3.1) "@monodeploy/changelog" (2021-04-28)<a name="0.3.1"></a>


## [0.3.0](https://github.com/tophat/monodeploy/compare/@monodeploy/changelog@0.2.6...@monodeploy/changelog@0.3.0) "@monodeploy/changelog" (2021-04-23)<a name="0.3.0"></a>

### Features

* **node:** add plumbing mode for changeset data ([#310](https://github.com/tophat/monodeploy/issues/310)) ([c768cf1](https://github.com/tophat/monodeploy/commits/c768cf1))


## [0.2.6](https://github.com/tophat/monodeploy/compare/@monodeploy/changelog@0.2.5...@monodeploy/changelog@0.2.6) "@monodeploy/changelog" (2021-04-12)<a name="0.2.6"></a>

### Bug Fixes

* target yarn v3 release candidate ([#304](https://github.com/tophat/monodeploy/issues/304)) ([d90765c](https://github.com/tophat/monodeploy/commits/d90765c))


## [0.2.5](https://github.com/tophat/monodeploy/compare/@monodeploy/changelog@0.2.4...@monodeploy/changelog@0.2.5) "@monodeploy/changelog" (2021-04-12)<a name="0.2.5"></a>


## [0.2.4](https://github.com/tophat/monodeploy/compare/@monodeploy/changelog@0.2.3...@monodeploy/changelog@0.2.4) "@monodeploy/changelog" (2021-04-09)<a name="0.2.4"></a>


## [0.2.3](https://github.com/tophat/monodeploy/compare/@monodeploy/changelog@0.2.2...@monodeploy/changelog@0.2.3) "@monodeploy/changelog" (2021-04-09)<a name="0.2.3"></a>

### Bug Fixes

* **publish:** upload to npm the most recent package manifest ([#299](https://github.com/tophat/monodeploy/issues/299)) ([4fb8f46](https://github.com/tophat/monodeploy/commits/4fb8f46))


## [0.2.2](https://github.com/tophat/monodeploy/compare/@monodeploy/changelog@0.2.1...@monodeploy/changelog@0.2.2) "@monodeploy/changelog" (2021-04-07)<a name="0.2.2"></a>


## [0.2.0](https://github.com/tophat/monodeploy/compare/@monodeploy/changelog@0.1.1...@monodeploy/changelog@0.2.0) "@monodeploy/changelog" (2021-03-08)<a name="0.2.0"></a>

### Features

* add topological sort, support for previewing changes ([#273](https://github.com/tophat/monodeploy/issues/273)) ([87b6a00](https://github.com/tophat/monodeploy/commits/87b6a00))
* rename private monodeploy packages for improved readability under scope ([#277](https://github.com/tophat/monodeploy/issues/277)) ([87b6a00](https://github.com/tophat/monodeploy/commits/87b6a00))
