# Changelog

<!-- MONODEPLOY:BELOW -->

## [0.11.4](https://github.com/tophat/monodeploy/compare/@monodeploy/node@0.11.3...@monodeploy/node@0.11.4) "@monodeploy/node" (2021-08-11)<a name="0.11.4"></a>

### Bug Fixes

* re-install project when persisting versions (#417) ([d431e76](https://github.com/tophat/monodeploy/commits/d431e76))




## [0.11.3](https://github.com/tophat/monodeploy/compare/@monodeploy/node@0.11.2...@monodeploy/node@0.11.3) "@monodeploy/node" (2021-08-08)<a name="0.11.3"></a>

### Bug Fixes

* revert 417 ([e5590e8](https://github.com/tophat/monodeploy/commits/e5590e8))




## [0.11.1](https://github.com/tophat/monodeploy/compare/@monodeploy/node@0.11.0...@monodeploy/node@0.11.1) "@monodeploy/node" (2021-07-26)<a name="0.11.1"></a>

### Bug Fixes

* update to yarn v3.0.0 ([c40a226](https://github.com/tophat/monodeploy/commits/c40a226))
* update to yarn v3.0.0 (#414) ([c40a226](https://github.com/tophat/monodeploy/commits/c40a226))




## [0.11.0](https://github.com/tophat/monodeploy/compare/@monodeploy/node@0.10.7...@monodeploy/node@0.11.0) "@monodeploy/node" (2021-07-26)<a name="0.11.0"></a>

### Features

* add commit ignore patterns config option (#413) ([7f503c4](https://github.com/tophat/monodeploy/commits/7f503c4))




## [0.10.7](https://github.com/tophat/monodeploy/compare/@monodeploy/node@0.10.6...@monodeploy/node@0.10.7) "@monodeploy/node" (2021-07-15)<a name="0.10.7"></a>

### Bug Fixes

* respect access and registry url per workspace, close #398 (#405) ([3f466ee](https://github.com/tophat/monodeploy/commits/3f466ee))
* add 'infer' access option to provide backwards compatibility (#407) ([3f466ee](https://github.com/tophat/monodeploy/commits/3f466ee))




## [0.10.6](https://github.com/tophat/monodeploy/compare/@monodeploy/node@0.10.5...@monodeploy/node@0.10.6) "@monodeploy/node" (2021-07-15)<a name="0.10.6"></a>

### Bug Fixes

* use accurate from version in changeset and logging (#404) ([45a1a74](https://github.com/tophat/monodeploy/commits/45a1a74))




## [0.10.3](https://github.com/tophat/monodeploy/compare/@monodeploy/node@0.10.2...@monodeploy/node@0.10.3) "@monodeploy/node" (2021-07-09)<a name="0.10.3"></a>

### Bug Fixes

* do not modify any files in dry run mode ([13a2904](https://github.com/tophat/monodeploy/commits/13a2904))

### Performance Improvements

* minor logging changes ([13a2904](https://github.com/tophat/monodeploy/commits/13a2904))




## [0.10.1](https://github.com/tophat/monodeploy/compare/@monodeploy/node@0.10.0...@monodeploy/node@0.10.1) "@monodeploy/node" (2021-07-05)<a name="0.10.1"></a>

### Bug Fixes

* update yarn to 3.0.0-rc.9 (#386) ([fcfc63a](https://github.com/tophat/monodeploy/commits/fcfc63a))




## [0.10.0](https://github.com/tophat/monodeploy/compare/@monodeploy/node@0.9.5...@monodeploy/node@0.10.0) "@monodeploy/node" (2021-07-05)<a name="0.10.0"></a>

### Bug Fixes

* refactor APIs to support non-latest dist tag (#374) ([a5c703e](https://github.com/tophat/monodeploy/commits/a5c703e))
* use and support repository url with subdirectories (#384) ([a5c703e](https://github.com/tophat/monodeploy/commits/a5c703e))

### Features

* add prerelease config options ([a5c703e](https://github.com/tophat/monodeploy/commits/a5c703e))
* add prerelease config options (#375) ([a5c703e](https://github.com/tophat/monodeploy/commits/a5c703e))
* pre-release support, close #292 ([a5c703e](https://github.com/tophat/monodeploy/commits/a5c703e))

### Performance Improvements

* use async exec in git commands ([a5c703e](https://github.com/tophat/monodeploy/commits/a5c703e))




## [0.9.4](https://github.com/tophat/monodeploy/compare/@monodeploy/node@0.9.3...@monodeploy/node@0.9.4) "@monodeploy/node" (2021-06-15)<a name="0.9.4"></a>

### Bug Fixes

* normalize registry url (#369) ([824b062](https://github.com/tophat/monodeploy/commits/824b062))




## [0.9.3](https://github.com/tophat/monodeploy/compare/@monodeploy/node@0.9.2...@monodeploy/node@0.9.3) "@monodeploy/node" (2021-06-11)<a name="0.9.3"></a>

### Bug Fixes

* preserve workspace protocol when persisting package.json to disk ([b2d532d](https://github.com/tophat/monodeploy/commits/b2d532d))
* preserve workspace protocol when persisting package.json to disk (#359) ([b2d532d](https://github.com/tophat/monodeploy/commits/b2d532d))




## [0.9.1](https://github.com/tophat/monodeploy/compare/@monodeploy/node@0.9.0...@monodeploy/node@0.9.1) "@monodeploy/node" (2021-06-08)<a name="0.9.1"></a>

### Bug Fixes

* do not generate changelog for dependent packages (#357) ([48ed33a](https://github.com/tophat/monodeploy/commits/48ed33a))




## [0.9.0](https://github.com/tophat/monodeploy/compare/@monodeploy/node@0.8.6...@monodeploy/node@0.9.0) "@monodeploy/node" (2021-06-06)<a name="0.9.0"></a>

### Features

* add changeset ignore patterns support (#353) ([9f5fec6](https://github.com/tophat/monodeploy/commits/9f5fec6))




## [0.8.6](https://github.com/tophat/monodeploy/compare/@monodeploy/node@0.8.5...@monodeploy/node@0.8.6) "@monodeploy/node" (2021-06-06)<a name="0.8.6"></a>

### Performance Improvements

* update yarn dependencies ([ef6f096](https://github.com/tophat/monodeploy/commits/ef6f096))
* update yarn dependencies (#348) ([ef6f096](https://github.com/tophat/monodeploy/commits/ef6f096))




## [0.8.5](https://github.com/tophat/monodeploy/compare/@monodeploy/node@0.8.4...@monodeploy/node@0.8.5) "@monodeploy/node" (2021-06-02)<a name="0.8.5"></a>



## [0.7.2](https://github.com/tophat/monodeploy/compare/@monodeploy/node@0.7.1...@monodeploy/node@0.7.2) "@monodeploy/node" (2021-05-06)<a name="0.7.2"></a>



## [0.7.1](https://github.com/tophat/monodeploy/compare/@monodeploy/node@0.7.0...@monodeploy/node@0.7.1) "@monodeploy/node" (2021-05-06)<a name="0.7.1"></a>



## [0.7.0](https://github.com/tophat/monodeploy/compare/@monodeploy/node@0.6.0...@monodeploy/node@0.7.0) "@monodeploy/node" (2021-05-01)<a name="0.7.0"></a>

### Features

* support packageDir changelog token for per package changelogs ([cca2cfe](https://github.com/tophat/monodeploy/commits/cca2cfe))
* **changelog**: add per package changelog support (#321) ([cca2cfe](https://github.com/tophat/monodeploy/commits/cca2cfe))


## [0.5.1](https://github.com/tophat/monodeploy/compare/@monodeploy/node@0.5.0...@monodeploy/node@0.5.1) "@monodeploy/node" (2021-04-28)<a name="0.5.1"></a>


## [0.5.0](https://github.com/tophat/monodeploy/compare/@monodeploy/node@0.4.4...@monodeploy/node@0.5.0) "@monodeploy/node" (2021-04-28)<a name="0.5.0"></a>

### Features

* **cli**: add network concurrency options to limit concurrent publishes ([#319](https://github.com/tophat/monodeploy/issues/319)) ([db84fc7](https://github.com/tophat/monodeploy/commits/db84fc7))
* **cli**: add no-git-tag option to disable git tagging ([#320](https://github.com/tophat/monodeploy/issues/320)) ([db84fc7](https://github.com/tophat/monodeploy/commits/db84fc7))


## [0.4.4](https://github.com/tophat/monodeploy/compare/@monodeploy/node@0.4.3...@monodeploy/node@0.4.4) "@monodeploy/node" (2021-04-27)<a name="0.4.4"></a>

### Bug Fixes

* **node:** write empty changeset if no packages updated ([#318](https://github.com/tophat/monodeploy/issues/318)) ([e937582](https://github.com/tophat/monodeploy/commits/e937582))


## [0.4.3](https://github.com/tophat/monodeploy/compare/@monodeploy/node@0.4.2...@monodeploy/node@0.4.3) "@monodeploy/node" (2021-04-26)<a name="0.4.3"></a>


## [0.4.2](https://github.com/tophat/monodeploy/compare/@monodeploy/node@0.4.1...@monodeploy/node@0.4.2) "@monodeploy/node" (2021-04-26)<a name="0.4.2"></a>


## [0.4.1](https://github.com/tophat/monodeploy/compare/@monodeploy/node@0.4.0...@monodeploy/node@0.4.1) "@monodeploy/node" (2021-04-23)<a name="0.4.1"></a>


## [0.4.0](https://github.com/tophat/monodeploy/compare/@monodeploy/node@0.3.5...@monodeploy/node@0.4.0) "@monodeploy/node" (2021-04-23)<a name="0.4.0"></a>

### Features

* **node:** add plumbing mode for changeset data ([#310](https://github.com/tophat/monodeploy/issues/310)) ([c768cf1](https://github.com/tophat/monodeploy/commits/c768cf1))


## [0.3.5](https://github.com/tophat/monodeploy/compare/@monodeploy/node@0.3.4...@monodeploy/node@0.3.5) "@monodeploy/node" (2021-04-13)<a name="0.3.5"></a>


## [0.3.4](https://github.com/tophat/monodeploy/compare/@monodeploy/node@0.3.3...@monodeploy/node@0.3.4) "@monodeploy/node" (2021-04-12)<a name="0.3.4"></a>

### Bug Fixes

* target yarn v3 release candidate ([#304](https://github.com/tophat/monodeploy/issues/304)) ([d90765c](https://github.com/tophat/monodeploy/commits/d90765c))


## [0.3.3](https://github.com/tophat/monodeploy/compare/@monodeploy/node@0.3.2...@monodeploy/node@0.3.3) "@monodeploy/node" (2021-04-12)<a name="0.3.3"></a>

### Bug Fixes

* **node:** skip incompatible plugins ([#303](https://github.com/tophat/monodeploy/issues/303)) ([ba80bae](https://github.com/tophat/monodeploy/commits/ba80bae))


## [0.3.2](https://github.com/tophat/monodeploy/compare/@monodeploy/node@0.3.1...@monodeploy/node@0.3.2) "@monodeploy/node" (2021-04-09)<a name="0.3.2"></a>


## [0.3.1](https://github.com/tophat/monodeploy/compare/@monodeploy/node@0.3.0...@monodeploy/node@0.3.1) "@monodeploy/node" (2021-04-09)<a name="0.3.1"></a>

### Bug Fixes

* **publish:** upload to npm the most recent package manifest ([#299](https://github.com/tophat/monodeploy/issues/299)) ([4fb8f46](https://github.com/tophat/monodeploy/commits/4fb8f46))


## [0.3.0](https://github.com/tophat/monodeploy/compare/@monodeploy/node@0.2.1...@monodeploy/node@0.3.0) "@monodeploy/node" (2021-04-07)<a name="0.3.0"></a>

### Features

* add config option to skip registry reads and writes ([#296](https://github.com/tophat/monodeploy/issues/296)) ([ad1fe9b](https://github.com/tophat/monodeploy/commits/ad1fe9b))


## [0.2.1](https://github.com/tophat/monodeploy/compare/@monodeploy/node@0.2.0...@monodeploy/node@0.2.1) "@monodeploy/node" (2021-03-10)<a name="0.2.1"></a>

### Bug Fixes

* improve log readability ([#283](https://github.com/tophat/monodeploy/issues/283)) ([dc93dcf](https://github.com/tophat/monodeploy/commits/dc93dcf))
* bump versions to release ([#284](https://github.com/tophat/monodeploy/issues/284)) ([dc93dcf](https://github.com/tophat/monodeploy/commits/dc93dcf))


## [0.2.0](https://github.com/tophat/monodeploy/compare/@monodeploy/node@0.1.1...@monodeploy/node@0.2.0) "@monodeploy/node" (2021-03-08)<a name="0.2.0"></a>

### Features

* add topological sort, support for previewing changes ([#273](https://github.com/tophat/monodeploy/issues/273)) ([87b6a00](https://github.com/tophat/monodeploy/commits/87b6a00))
* rename private monodeploy packages for improved readability under scope ([#277](https://github.com/tophat/monodeploy/issues/277)) ([87b6a00](https://github.com/tophat/monodeploy/commits/87b6a00))
