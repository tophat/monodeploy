# Changelog

<!-- MONODEPLOY:BELOW -->

## [0.6.1](https://github.com/tophat/monodeploy/compare/@monodeploy/publish@0.6.0...@monodeploy/publish@0.6.1) "@monodeploy/publish" (2021-11-22)<a name="0.6.1"></a>

### Bug Fixes

* only commit pnp files if they exist ([b14f8f3](https://github.com/tophat/monodeploy/commits/b14f8f3))
* only commit pnp files if they exist (#445) ([b14f8f3](https://github.com/tophat/monodeploy/commits/b14f8f3))




## [0.6.0](https://github.com/tophat/monodeploy/compare/@monodeploy/publish@0.5.15...@monodeploy/publish@0.6.0) "@monodeploy/publish" (2021-11-19)<a name="0.6.0"></a>

### Bug Fixes

* include .pnp.cjs when committing changes ([8a031e6](https://github.com/tophat/monodeploy/commits/8a031e6))
* git add generated `.pnp.cjs` when autocommiting (#438) ([8a031e6](https://github.com/tophat/monodeploy/commits/8a031e6))

### Features

* improved error messages when running exec commands

Co-authored-by: noahnu <noahnu@gmail.com> ([8a031e6](https://github.com/tophat/monodeploy/commits/8a031e6))




## [0.5.14](https://github.com/tophat/monodeploy/compare/@monodeploy/publish@0.5.13...@monodeploy/publish@0.5.14) "@monodeploy/publish" (2021-10-25)<a name="0.5.14"></a>

### Bug Fixes

* update to yarn 3.1.0 (#440) ([5eb4ad0](https://github.com/tophat/monodeploy/commits/5eb4ad0))




## [0.5.13](https://github.com/tophat/monodeploy/compare/@monodeploy/publish@0.5.12...@monodeploy/publish@0.5.13) "@monodeploy/publish" (2021-10-11)<a name="0.5.13"></a>

### Bug Fixes

* update internal yarn dependencies (#433) ([a8d6fcb](https://github.com/tophat/monodeploy/commits/a8d6fcb))
* use cross platform exec for windows support (#434) ([3dcbfb4](https://github.com/tophat/monodeploy/commits/3dcbfb4))
* include version in publish logging (#436) ([754ff51](https://github.com/tophat/monodeploy/commits/754ff51))




## [0.5.12](https://github.com/tophat/monodeploy/compare/@monodeploy/publish@0.5.11...@monodeploy/publish@0.5.12) "@monodeploy/publish" (2021-09-15)<a name="0.5.12"></a>

### Bug Fixes

* update yarn dependencies (#429) ([03a82b7](https://github.com/tophat/monodeploy/commits/03a82b7))
* more detailed publish logs (#432) ([239b6d2](https://github.com/tophat/monodeploy/commits/239b6d2))




## [0.5.11](https://github.com/tophat/monodeploy/compare/@monodeploy/publish@0.5.10...@monodeploy/publish@0.5.11) "@monodeploy/publish" (2021-08-16)<a name="0.5.11"></a>

### Bug Fixes

* wrap changelog filename in quotes to perform globbing by git ([b8ca828](https://github.com/tophat/monodeploy/commits/b8ca828))




## [0.5.7](https://github.com/tophat/monodeploy/compare/@monodeploy/publish@0.5.6...@monodeploy/publish@0.5.7) "@monodeploy/publish" (2021-07-26)<a name="0.5.7"></a>

### Bug Fixes

* update to yarn v3.0.0 ([c40a226](https://github.com/tophat/monodeploy/commits/c40a226))
* update to yarn v3.0.0 (#414) ([c40a226](https://github.com/tophat/monodeploy/commits/c40a226))




## [0.5.5](https://github.com/tophat/monodeploy/compare/@monodeploy/publish@0.5.4...@monodeploy/publish@0.5.5) "@monodeploy/publish" (2021-07-15)<a name="0.5.5"></a>

### Bug Fixes

* respect access and registry url per workspace, close #398 (#405) ([3f466ee](https://github.com/tophat/monodeploy/commits/3f466ee))
* add 'infer' access option to provide backwards compatibility (#407) ([3f466ee](https://github.com/tophat/monodeploy/commits/3f466ee))




## [0.5.3](https://github.com/tophat/monodeploy/compare/@monodeploy/publish@0.5.2...@monodeploy/publish@0.5.3) "@monodeploy/publish" (2021-07-09)<a name="0.5.3"></a>

### Bug Fixes

* do not execute lifecycle scripts in dry run ([13a2904](https://github.com/tophat/monodeploy/commits/13a2904))




## [0.5.1](https://github.com/tophat/monodeploy/compare/@monodeploy/publish@0.5.0...@monodeploy/publish@0.5.1) "@monodeploy/publish" (2021-07-05)<a name="0.5.1"></a>

### Bug Fixes

* update yarn to 3.0.0-rc.9 (#386) ([fcfc63a](https://github.com/tophat/monodeploy/commits/fcfc63a))




## [0.5.0](https://github.com/tophat/monodeploy/compare/@monodeploy/publish@0.4.8...@monodeploy/publish@0.5.0) "@monodeploy/publish" (2021-07-05)<a name="0.5.0"></a>

### Bug Fixes

* refactor APIs to support non-latest dist tag (#374) ([a5c703e](https://github.com/tophat/monodeploy/commits/a5c703e))
* use and support repository url with subdirectories (#384) ([a5c703e](https://github.com/tophat/monodeploy/commits/a5c703e))

### Features

* pre-release support, close #292 ([a5c703e](https://github.com/tophat/monodeploy/commits/a5c703e))




## [0.4.8](https://github.com/tophat/monodeploy/compare/@monodeploy/publish@0.4.7...@monodeploy/publish@0.4.8) "@monodeploy/publish" (2021-06-16)<a name="0.4.8"></a>

### Bug Fixes

* auto commit top level package.json changes (#372) ([41f1360](https://github.com/tophat/monodeploy/commits/41f1360))




## [0.4.7](https://github.com/tophat/monodeploy/compare/@monodeploy/publish@0.4.6...@monodeploy/publish@0.4.7) "@monodeploy/publish" (2021-06-11)<a name="0.4.7"></a>

### Bug Fixes

* preserve workspace protocol when persisting package.json to disk ([b2d532d](https://github.com/tophat/monodeploy/commits/b2d532d))
* preserve workspace protocol when persisting package.json to disk (#359) ([b2d532d](https://github.com/tophat/monodeploy/commits/b2d532d))




## [0.4.5](https://github.com/tophat/monodeploy/compare/@monodeploy/publish@0.4.4...@monodeploy/publish@0.4.5) "@monodeploy/publish" (2021-06-06)<a name="0.4.5"></a>

### Performance Improvements

* update yarn dependencies ([ef6f096](https://github.com/tophat/monodeploy/commits/ef6f096))
* update yarn dependencies (#348) ([ef6f096](https://github.com/tophat/monodeploy/commits/ef6f096))




## [0.4.4](https://github.com/tophat/monodeploy/compare/@monodeploy/publish@0.4.3...@monodeploy/publish@0.4.4) "@monodeploy/publish" (2021-06-02)<a name="0.4.4"></a>



## [0.3.0](https://github.com/tophat/monodeploy/compare/@monodeploy/publish@0.2.6...@monodeploy/publish@0.3.0) "@monodeploy/publish" (2021-04-28)<a name="0.3.0"></a>

### Features

* **cli**: add network concurrency options to limit concurrent publishes ([#319](https://github.com/tophat/monodeploy/issues/319)) ([db84fc7](https://github.com/tophat/monodeploy/commits/db84fc7))
* **cli**: add no-git-tag option to disable git tagging ([#320](https://github.com/tophat/monodeploy/issues/320)) ([db84fc7](https://github.com/tophat/monodeploy/commits/db84fc7))


## [0.2.6](https://github.com/tophat/monodeploy/compare/@monodeploy/publish@0.2.5...@monodeploy/publish@0.2.6) "@monodeploy/publish" (2021-04-26)<a name="0.2.6"></a>


## [0.2.5](https://github.com/tophat/monodeploy/compare/@monodeploy/publish@0.2.4...@monodeploy/publish@0.2.5) "@monodeploy/publish" (2021-04-13)<a name="0.2.5"></a>


## [0.2.4](https://github.com/tophat/monodeploy/compare/@monodeploy/publish@0.2.3...@monodeploy/publish@0.2.4) "@monodeploy/publish" (2021-04-12)<a name="0.2.4"></a>

### Bug Fixes

* target yarn v3 release candidate ([#304](https://github.com/tophat/monodeploy/issues/304)) ([d90765c](https://github.com/tophat/monodeploy/commits/d90765c))


## [0.2.3](https://github.com/tophat/monodeploy/compare/@monodeploy/publish@0.2.2...@monodeploy/publish@0.2.3) "@monodeploy/publish" (2021-04-12)<a name="0.2.3"></a>

### Bug Fixes

* **node:** skip incompatible plugins ([#303](https://github.com/tophat/monodeploy/issues/303)) ([ba80bae](https://github.com/tophat/monodeploy/commits/ba80bae))


## [0.2.2](https://github.com/tophat/monodeploy/compare/@monodeploy/publish@0.2.1...@monodeploy/publish@0.2.2) "@monodeploy/publish" (2021-04-09)<a name="0.2.2"></a>


## [0.2.1](https://github.com/tophat/monodeploy/compare/@monodeploy/publish@0.2.0...@monodeploy/publish@0.2.1) "@monodeploy/publish" (2021-04-09)<a name="0.2.1"></a>

### Bug Fixes

* **publish:** upload to npm the most recent package manifest ([#299](https://github.com/tophat/monodeploy/issues/299)) ([4fb8f46](https://github.com/tophat/monodeploy/commits/4fb8f46))


## [0.2.0](https://github.com/tophat/monodeploy/compare/@monodeploy/publish@0.1.1...@monodeploy/publish@0.2.0) "@monodeploy/publish" (2021-04-07)<a name="0.2.0"></a>

### Features

* add config option to skip registry reads and writes ([#296](https://github.com/tophat/monodeploy/issues/296)) ([ad1fe9b](https://github.com/tophat/monodeploy/commits/ad1fe9b))


## [0.1.1](https://github.com/tophat/monodeploy/compare/@monodeploy/publish@0.1.0...@monodeploy/publish@0.1.1) "@monodeploy/publish" (2021-03-10)<a name="0.1.1"></a>

### Bug Fixes

* use scoped name in publish log message ([#278](https://github.com/tophat/monodeploy/issues/278)) ([dc93dcf](https://github.com/tophat/monodeploy/commits/dc93dcf))
* improve log readability ([#283](https://github.com/tophat/monodeploy/issues/283)) ([dc93dcf](https://github.com/tophat/monodeploy/commits/dc93dcf))
* bump versions to release ([#284](https://github.com/tophat/monodeploy/issues/284)) ([dc93dcf](https://github.com/tophat/monodeploy/commits/dc93dcf))


## [0.1.0](https://github.com/tophat/monodeploy/compare/@monodeploy/publish@0.0.5...@monodeploy/publish@0.1.0) "@monodeploy/publish" (2021-03-08)<a name="0.1.0"></a>

### Features

* add topological sort, support for previewing changes ([#273](https://github.com/tophat/monodeploy/issues/273)) ([87b6a00](https://github.com/tophat/monodeploy/commits/87b6a00))
* rename private monodeploy packages for improved readability under scope ([#277](https://github.com/tophat/monodeploy/issues/277)) ([87b6a00](https://github.com/tophat/monodeploy/commits/87b6a00))
