# Changelog

<!-- MONODEPLOY:BELOW -->

## [0.9.1](https://github.com/tophat/monodeploy/compare/@monodeploy/types@0.9.0...@monodeploy/types@0.9.1) "@monodeploy/types" (2021-07-15)<a name="0.9.1"></a>

### Bug Fixes

* respect access and registry url per workspace, close #398 (#405) ([3f466ee](https://github.com/tophat/monodeploy/commits/3f466ee))
* add 'infer' access option to provide backwards compatibility (#407) ([3f466ee](https://github.com/tophat/monodeploy/commits/3f466ee))




## [0.9.0](https://github.com/tophat/monodeploy/compare/@monodeploy/types@0.8.0...@monodeploy/types@0.9.0) "@monodeploy/types" (2021-07-12)<a name="0.9.0"></a>

### Features

* support custom configuration for conventional changelog config ([5312462](https://github.com/tophat/monodeploy/commits/5312462))




## [0.8.0](https://github.com/tophat/monodeploy/compare/@monodeploy/types@0.7.1...@monodeploy/types@0.8.0) "@monodeploy/types" (2021-07-06)<a name="0.8.0"></a>

### Features

* expose strategy and previous version in changeset file (#387) ([f2e506b](https://github.com/tophat/monodeploy/commits/f2e506b))




## [0.7.1](https://github.com/tophat/monodeploy/compare/@monodeploy/types@0.7.0...@monodeploy/types@0.7.1) "@monodeploy/types" (2021-07-05)<a name="0.7.1"></a>

### Bug Fixes

* update yarn to 3.0.0-rc.9 (#386) ([fcfc63a](https://github.com/tophat/monodeploy/commits/fcfc63a))




## [0.7.0](https://github.com/tophat/monodeploy/compare/@monodeploy/types@0.6.1...@monodeploy/types@0.7.0) "@monodeploy/types" (2021-07-05)<a name="0.7.0"></a>

### Bug Fixes

* refactor APIs to support non-latest dist tag (#374) ([a5c703e](https://github.com/tophat/monodeploy/commits/a5c703e))
* use and support repository url with subdirectories (#384) ([a5c703e](https://github.com/tophat/monodeploy/commits/a5c703e))

### Features

* add prerelease config options ([a5c703e](https://github.com/tophat/monodeploy/commits/a5c703e))
* add prerelease config options (#375) ([a5c703e](https://github.com/tophat/monodeploy/commits/a5c703e))
* pre-release support, close #292 ([a5c703e](https://github.com/tophat/monodeploy/commits/a5c703e))




## [0.6.1](https://github.com/tophat/monodeploy/compare/@monodeploy/types@0.6.0...@monodeploy/types@0.6.1) "@monodeploy/types" (2021-06-11)<a name="0.6.1"></a>

### Bug Fixes

* preserve workspace protocol when persisting package.json to disk ([b2d532d](https://github.com/tophat/monodeploy/commits/b2d532d))
* preserve workspace protocol when persisting package.json to disk (#359) ([b2d532d](https://github.com/tophat/monodeploy/commits/b2d532d))




## [0.6.0](https://github.com/tophat/monodeploy/compare/@monodeploy/types@0.5.0...@monodeploy/types@0.6.0) "@monodeploy/types" (2021-06-06)<a name="0.6.0"></a>

### Features

* **types**: add changeset ignore patterns (#352) ([ef6f096](https://github.com/tophat/monodeploy/commits/ef6f096))

### Performance Improvements

* update yarn dependencies ([ef6f096](https://github.com/tophat/monodeploy/commits/ef6f096))
* update yarn dependencies (#348) ([ef6f096](https://github.com/tophat/monodeploy/commits/ef6f096))




## [0.4.0](https://github.com/tophat/monodeploy/compare/@monodeploy/types@0.3.3...@monodeploy/types@0.4.0) "@monodeploy/types" (2021-04-28)<a name="0.4.0"></a>

### Features

* **cli**: add network concurrency options to limit concurrent publishes ([#319](https://github.com/tophat/monodeploy/issues/319)) ([db84fc7](https://github.com/tophat/monodeploy/commits/db84fc7))
* **cli**: add no-git-tag option to disable git tagging ([#320](https://github.com/tophat/monodeploy/issues/320)) ([db84fc7](https://github.com/tophat/monodeploy/commits/db84fc7))


## [0.3.3](https://github.com/tophat/monodeploy/compare/@monodeploy/types@0.3.2...@monodeploy/types@0.3.3) "@monodeploy/types" (2021-04-12)<a name="0.3.3"></a>

### Bug Fixes

* target yarn v3 release candidate ([#304](https://github.com/tophat/monodeploy/issues/304)) ([d90765c](https://github.com/tophat/monodeploy/commits/d90765c))


## [0.3.2](https://github.com/tophat/monodeploy/compare/@monodeploy/types@0.3.1...@monodeploy/types@0.3.2) "@monodeploy/types" (2021-04-12)<a name="0.3.2"></a>

### Bug Fixes

* **node:** skip incompatible plugins ([#303](https://github.com/tophat/monodeploy/issues/303)) ([ba80bae](https://github.com/tophat/monodeploy/commits/ba80bae))


## [0.3.1](https://github.com/tophat/monodeploy/compare/@monodeploy/types@0.3.0...@monodeploy/types@0.3.1) "@monodeploy/types" (2021-04-09)<a name="0.3.1"></a>

### Bug Fixes

* **publish:** upload to npm the most recent package manifest ([#299](https://github.com/tophat/monodeploy/issues/299)) ([4fb8f46](https://github.com/tophat/monodeploy/commits/4fb8f46))


## [0.3.0](https://github.com/tophat/monodeploy/compare/@monodeploy/types@0.2.1...@monodeploy/types@0.3.0) "@monodeploy/types" (2021-04-07)<a name="0.3.0"></a>

### Features

* add config option to skip registry reads and writes ([#296](https://github.com/tophat/monodeploy/issues/296)) ([ad1fe9b](https://github.com/tophat/monodeploy/commits/ad1fe9b))


## [0.2.1](https://github.com/tophat/monodeploy/compare/@monodeploy/types@0.2.0...@monodeploy/types@0.2.1) "@monodeploy/types" (2021-03-10)<a name="0.2.1"></a>

### Bug Fixes

* bump versions to release ([#284](https://github.com/tophat/monodeploy/issues/284)) ([dc93dcf](https://github.com/tophat/monodeploy/commits/dc93dcf))


## [0.2.0](https://github.com/tophat/monodeploy/compare/@monodeploy/types@0.1.1...@monodeploy/types@0.2.0) "@monodeploy/types" (2021-03-08)<a name="0.2.0"></a>

### Features

* add topological sort, support for previewing changes ([#273](https://github.com/tophat/monodeploy/issues/273)) ([87b6a00](https://github.com/tophat/monodeploy/commits/87b6a00))
* rename private monodeploy packages for improved readability under scope ([#277](https://github.com/tophat/monodeploy/issues/277)) ([87b6a00](https://github.com/tophat/monodeploy/commits/87b6a00))
