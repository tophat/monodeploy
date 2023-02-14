# Changelog

<!-- MONODEPLOY:BELOW -->

## [3.7.0](https://github.com/tophat/monodeploy/compare/@monodeploy/dependencies@3.6.0...@monodeploy/dependencies@3.7.0) "@monodeploy/dependencies" (2023-02-14)<a name="3.7.0"></a>

### Features

* update yarn to 3.4.1 (#590) ([217aaa9](https://github.com/tophat/monodeploy/commits/217aaa9))




## [3.6.0](https://github.com/tophat/monodeploy/compare/@monodeploy/dependencies@3.5.0...@monodeploy/dependencies@3.6.0) "@monodeploy/dependencies" (2023-01-03)<a name="3.6.0"></a>

### Features

* target yarn 3.3.1 (#589) ([f3bd3bc](https://github.com/tophat/monodeploy/commits/f3bd3bc))




## [3.5.0](https://github.com/tophat/monodeploy/compare/@monodeploy/dependencies@3.3.1...@monodeploy/dependencies@3.5.0) "@monodeploy/dependencies" (2022-11-30)<a name="3.5.0"></a>

### Features

* target yarn v3.3.0 ([0f1248e](https://github.com/tophat/monodeploy/commits/0f1248e))
* target yarn v3.3.0 (#576) ([0f1248e](https://github.com/tophat/monodeploy/commits/0f1248e))




## [3.3.1](https://github.com/tophat/monodeploy/compare/@monodeploy/dependencies@3.3.0...@monodeploy/dependencies@3.3.1) "@monodeploy/dependencies" (2022-10-13)<a name="3.3.1"></a>

### Bug Fixes

* update to yarn 3.2.3 (#513) ([a6e8030](https://github.com/tophat/monodeploy/commits/a6e8030))
* update to yarn 3.2.4 ([6aebff9](https://github.com/tophat/monodeploy/commits/6aebff9))




## [3.2.0](https://github.com/tophat/monodeploy/compare/@monodeploy/dependencies@3.1.0...@monodeploy/dependencies@3.2.0) "@monodeploy/dependencies" (2022-08-01)<a name="3.2.0"></a>

### Features

* build against Yarn 3.2.2 (#506) ([11d117c](https://github.com/tophat/monodeploy/commits/11d117c))




## [3.0.1](https://github.com/tophat/monodeploy/compare/@monodeploy/dependencies@3.0.0...@monodeploy/dependencies@3.0.1) "@monodeploy/dependencies" (2022-05-26)<a name="3.0.1"></a>

### Bug Fixes

* target yarn 3.2.1 (#495) ([e13073f](https://github.com/tophat/monodeploy/commits/e13073f))




## [3.0.0](https://github.com/tophat/monodeploy/compare/@monodeploy/dependencies@0.3.12...@monodeploy/dependencies@3.0.0) "@monodeploy/dependencies" (2022-04-10)<a name="3.0.0"></a>

### Breaking Changes

* Private workspaces are now no longer pruned prior to dependency graph traversal and when considering version strategies for a group. This means you can create a private workspace as a devDependency of other packages and updates to that private workspace will propagate to the dependents with the correct version strategy -- assuming all these packages are in the same group. The private package, although considered when determining the version strategy, is not published. ([3c10414](https://github.com/tophat/monodeploy/commits/3c10414))

### Bug Fixes

* compatibility with yarn 3.2.0, update dependencies (#474) ([ba475a5](https://github.com/tophat/monodeploy/commits/ba475a5))

### Features

* support grouping packages similar to lerna fixed mode #415 (#453) ([1e8711a](https://github.com/tophat/monodeploy/commits/1e8711a))
* consider private workspaces when determining updates (#468) ([3c10414](https://github.com/tophat/monodeploy/commits/3c10414))




## [0.3.11](https://github.com/tophat/monodeploy/compare/@monodeploy/dependencies@0.3.10...@monodeploy/dependencies@0.3.11) "@monodeploy/dependencies" (2021-11-19)<a name="0.3.11"></a>

### Bug Fixes

* overeager detection of cycles in topological sort (#443) ([78f1374](https://github.com/tophat/monodeploy/commits/78f1374))




## [0.3.10](https://github.com/tophat/monodeploy/compare/@monodeploy/dependencies@0.3.9...@monodeploy/dependencies@0.3.10) "@monodeploy/dependencies" (2021-10-25)<a name="0.3.10"></a>

### Bug Fixes

* update to yarn 3.1.0 (#440) ([5eb4ad0](https://github.com/tophat/monodeploy/commits/5eb4ad0))




## [0.3.9](https://github.com/tophat/monodeploy/compare/@monodeploy/dependencies@0.3.8...@monodeploy/dependencies@0.3.9) "@monodeploy/dependencies" (2021-10-11)<a name="0.3.9"></a>

### Bug Fixes

* update internal yarn dependencies (#433) ([a8d6fcb](https://github.com/tophat/monodeploy/commits/a8d6fcb))
* use cross platform exec for windows support (#434) ([3dcbfb4](https://github.com/tophat/monodeploy/commits/3dcbfb4))




## [0.3.8](https://github.com/tophat/monodeploy/compare/@monodeploy/dependencies@0.3.7...@monodeploy/dependencies@0.3.8) "@monodeploy/dependencies" (2021-09-15)<a name="0.3.8"></a>

### Bug Fixes

* update yarn dependencies (#429) ([03a82b7](https://github.com/tophat/monodeploy/commits/03a82b7))




## [0.3.7](https://github.com/tophat/monodeploy/compare/@monodeploy/dependencies@0.3.6...@monodeploy/dependencies@0.3.7) "@monodeploy/dependencies" (2021-08-13)<a name="0.3.7"></a>

### Bug Fixes

* use `tryWorkspaceByIdent` instead of `tryWorkspaceByDescriptor` ([3aa83af](https://github.com/tophat/monodeploy/commits/3aa83af))




## [0.3.6](https://github.com/tophat/monodeploy/compare/@monodeploy/dependencies@0.3.5...@monodeploy/dependencies@0.3.6) "@monodeploy/dependencies" (2021-07-26)<a name="0.3.6"></a>

### Bug Fixes

* update to yarn v3.0.0 ([c40a226](https://github.com/tophat/monodeploy/commits/c40a226))
* update to yarn v3.0.0 (#414) ([c40a226](https://github.com/tophat/monodeploy/commits/c40a226))




## [0.3.1](https://github.com/tophat/monodeploy/compare/@monodeploy/dependencies@0.3.0...@monodeploy/dependencies@0.3.1) "@monodeploy/dependencies" (2021-07-05)<a name="0.3.1"></a>

### Bug Fixes

* update yarn to 3.0.0-rc.9 (#386) ([fcfc63a](https://github.com/tophat/monodeploy/commits/fcfc63a))




## [0.3.0](https://github.com/tophat/monodeploy/compare/@monodeploy/dependencies@0.2.9...@monodeploy/dependencies@0.3.0) "@monodeploy/dependencies" (2021-07-05)<a name="0.3.0"></a>

### Bug Fixes

* dependents algorithm missing dependents ([a5c703e](https://github.com/tophat/monodeploy/commits/a5c703e))
* use and support repository url with subdirectories (#384) ([a5c703e](https://github.com/tophat/monodeploy/commits/a5c703e))

### Features

* support resetting pre-release version if out of date ([a5c703e](https://github.com/tophat/monodeploy/commits/a5c703e))




## [0.2.9](https://github.com/tophat/monodeploy/compare/@monodeploy/dependencies@0.2.8...@monodeploy/dependencies@0.2.9) "@monodeploy/dependencies" (2021-06-11)<a name="0.2.9"></a>

### Bug Fixes

* preserve workspace protocol when persisting package.json to disk ([b2d532d](https://github.com/tophat/monodeploy/commits/b2d532d))
* preserve workspace protocol when persisting package.json to disk (#359) ([b2d532d](https://github.com/tophat/monodeploy/commits/b2d532d))




## [0.2.8](https://github.com/tophat/monodeploy/compare/@monodeploy/dependencies@0.2.7...@monodeploy/dependencies@0.2.8) "@monodeploy/dependencies" (2021-06-06)<a name="0.2.8"></a>

### Performance Improvements

* update yarn dependencies ([ef6f096](https://github.com/tophat/monodeploy/commits/ef6f096))
* update yarn dependencies (#348) ([ef6f096](https://github.com/tophat/monodeploy/commits/ef6f096))




## [0.2.6](https://github.com/tophat/monodeploy/compare/@monodeploy/dependencies@0.2.5...@monodeploy/dependencies@0.2.6) "@monodeploy/dependencies" (2021-04-28)<a name="0.2.6"></a>


## [0.2.5](https://github.com/tophat/monodeploy/compare/@monodeploy/dependencies@0.2.4...@monodeploy/dependencies@0.2.5) "@monodeploy/dependencies" (2021-04-12)<a name="0.2.5"></a>

### Bug Fixes

* target yarn v3 release candidate ([#304](https://github.com/tophat/monodeploy/issues/304)) ([d90765c](https://github.com/tophat/monodeploy/commits/d90765c))


## [0.2.4](https://github.com/tophat/monodeploy/compare/@monodeploy/dependencies@0.2.3...@monodeploy/dependencies@0.2.4) "@monodeploy/dependencies" (2021-04-12)<a name="0.2.4"></a>

### Bug Fixes

* **node:** skip incompatible plugins ([#303](https://github.com/tophat/monodeploy/issues/303)) ([ba80bae](https://github.com/tophat/monodeploy/commits/ba80bae))


## [0.2.3](https://github.com/tophat/monodeploy/compare/@monodeploy/dependencies@0.2.2...@monodeploy/dependencies@0.2.3) "@monodeploy/dependencies" (2021-04-09)<a name="0.2.3"></a>

### Bug Fixes

* **publish:** upload to npm the most recent package manifest ([#299](https://github.com/tophat/monodeploy/issues/299)) ([4fb8f46](https://github.com/tophat/monodeploy/commits/4fb8f46))


## [0.2.2](https://github.com/tophat/monodeploy/compare/@monodeploy/dependencies@0.2.1...@monodeploy/dependencies@0.2.2) "@monodeploy/dependencies" (2021-04-07)<a name="0.2.2"></a>


## [0.2.1](https://github.com/tophat/monodeploy/compare/@monodeploy/dependencies@0.2.0...@monodeploy/dependencies@0.2.1) "@monodeploy/dependencies" (2021-03-10)<a name="0.2.1"></a>

### Bug Fixes

* bump versions to release ([#284](https://github.com/tophat/monodeploy/issues/284)) ([dc93dcf](https://github.com/tophat/monodeploy/commits/dc93dcf))


## [0.2.0](https://github.com/tophat/monodeploy/compare/@monodeploy/dependencies@0.1.1...@monodeploy/dependencies@0.2.0) "@monodeploy/dependencies" (2021-03-08)<a name="0.2.0"></a>

### Features

* add topological sort, support for previewing changes ([#273](https://github.com/tophat/monodeploy/issues/273)) ([87b6a00](https://github.com/tophat/monodeploy/commits/87b6a00))
* rename private monodeploy packages for improved readability under scope ([#277](https://github.com/tophat/monodeploy/issues/277)) ([87b6a00](https://github.com/tophat/monodeploy/commits/87b6a00))
