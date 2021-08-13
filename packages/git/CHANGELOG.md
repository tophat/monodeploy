# Changelog

<!-- MONODEPLOY:BELOW -->

## [0.3.8](https://github.com/tophat/monodeploy/compare/@monodeploy/git@0.3.7...@monodeploy/git@0.3.8) "@monodeploy/git" (2021-08-13)<a name="0.3.8"></a>

### Reverts

* Revert [742122d](https://github.com/tophat/monodeploy/commits/742122d): "Merge pull request #425 from tophat/use_ancestry_path" ([a81faf0](https://github.com/tophat/monodeploy/commits/a81faf0))




## [0.3.7](https://github.com/tophat/monodeploy/compare/@monodeploy/git@0.3.6...@monodeploy/git@0.3.7) "@monodeploy/git" (2021-08-13)<a name="0.3.7"></a>

### Bug Fixes

* limit discovered commits to ancestry path to improve merge parsing ([742122d](https://github.com/tophat/monodeploy/commits/742122d))




## [0.3.6](https://github.com/tophat/monodeploy/compare/@monodeploy/git@0.3.5...@monodeploy/git@0.3.6) "@monodeploy/git" (2021-07-26)<a name="0.3.6"></a>

### Bug Fixes

* update to yarn v3.0.0 ([c40a226](https://github.com/tophat/monodeploy/commits/c40a226))
* update to yarn v3.0.0 (#414) ([c40a226](https://github.com/tophat/monodeploy/commits/c40a226))




## [0.3.1](https://github.com/tophat/monodeploy/compare/@monodeploy/git@0.3.0...@monodeploy/git@0.3.1) "@monodeploy/git" (2021-07-05)<a name="0.3.1"></a>

### Bug Fixes

* update yarn to 3.0.0-rc.9 (#386) ([fcfc63a](https://github.com/tophat/monodeploy/commits/fcfc63a))




## [0.3.0](https://github.com/tophat/monodeploy/compare/@monodeploy/git@0.2.4...@monodeploy/git@0.3.0) "@monodeploy/git" (2021-07-05)<a name="0.3.0"></a>

### Bug Fixes

* only consider release tags ([a5c703e](https://github.com/tophat/monodeploy/commits/a5c703e))
* use and support repository url with subdirectories (#384) ([a5c703e](https://github.com/tophat/monodeploy/commits/a5c703e))

### Features

* prerelease tags should be ignored in non-prerelease mode ([a5c703e](https://github.com/tophat/monodeploy/commits/a5c703e))

### Performance Improvements

* use async exec in git commands ([a5c703e](https://github.com/tophat/monodeploy/commits/a5c703e))




## [0.2.4](https://github.com/tophat/monodeploy/compare/@monodeploy/git@0.2.3...@monodeploy/git@0.2.4) "@monodeploy/git" (2021-06-11)<a name="0.2.4"></a>

### Bug Fixes

* preserve workspace protocol when persisting package.json to disk ([b2d532d](https://github.com/tophat/monodeploy/commits/b2d532d))
* preserve workspace protocol when persisting package.json to disk (#359) ([b2d532d](https://github.com/tophat/monodeploy/commits/b2d532d))




## [0.2.3](https://github.com/tophat/monodeploy/compare/@monodeploy/git@0.2.2...@monodeploy/git@0.2.3) "@monodeploy/git" (2021-06-06)<a name="0.2.3"></a>

### Performance Improvements

* update yarn dependencies ([ef6f096](https://github.com/tophat/monodeploy/commits/ef6f096))
* update yarn dependencies (#348) ([ef6f096](https://github.com/tophat/monodeploy/commits/ef6f096))




## [0.2.2](https://github.com/tophat/monodeploy/compare/@monodeploy/git@0.2.1...@monodeploy/git@0.2.2) "@monodeploy/git" (2021-06-02)<a name="0.2.2"></a>

### Bug Fixes

* package.json and changelog modifications were not being pushed (#347) ([17b6ea8](https://github.com/tophat/monodeploy/commits/17b6ea8))




## [0.1.8](https://github.com/tophat/monodeploy/compare/@monodeploy/git@0.1.7...@monodeploy/git@0.1.8) "@monodeploy/git" (2021-04-28)<a name="0.1.8"></a>


## [0.1.7](https://github.com/tophat/monodeploy/compare/@monodeploy/git@0.1.6...@monodeploy/git@0.1.7) "@monodeploy/git" (2021-04-26)<a name="0.1.7"></a>

### Bug Fixes

* **git:** use asymmetric diff for determining commits to process ([#315](https://github.com/tophat/monodeploy/issues/315)) ([838e8bc](https://github.com/tophat/monodeploy/commits/838e8bc))


## [0.1.6](https://github.com/tophat/monodeploy/compare/@monodeploy/git@0.1.5...@monodeploy/git@0.1.6) "@monodeploy/git" (2021-04-13)<a name="0.1.6"></a>

### Bug Fixes

* **git:** default to HEAD^ if no tag exists on initial publish ([#305](https://github.com/tophat/monodeploy/issues/305)) ([49111ba](https://github.com/tophat/monodeploy/commits/49111ba))


## [0.1.5](https://github.com/tophat/monodeploy/compare/@monodeploy/git@0.1.4...@monodeploy/git@0.1.5) "@monodeploy/git" (2021-04-12)<a name="0.1.5"></a>


## [0.1.4](https://github.com/tophat/monodeploy/compare/@monodeploy/git@0.1.3...@monodeploy/git@0.1.4) "@monodeploy/git" (2021-04-12)<a name="0.1.4"></a>

### Bug Fixes

* **node:** skip incompatible plugins ([#303](https://github.com/tophat/monodeploy/issues/303)) ([ba80bae](https://github.com/tophat/monodeploy/commits/ba80bae))


## [0.1.3](https://github.com/tophat/monodeploy/compare/@monodeploy/git@0.1.2...@monodeploy/git@0.1.3) "@monodeploy/git" (2021-04-09)<a name="0.1.3"></a>

### Bug Fixes

* **publish:** upload to npm the most recent package manifest ([#299](https://github.com/tophat/monodeploy/issues/299)) ([4fb8f46](https://github.com/tophat/monodeploy/commits/4fb8f46))


## [0.1.2](https://github.com/tophat/monodeploy/compare/@monodeploy/git@0.1.1...@monodeploy/git@0.1.2) "@monodeploy/git" (2021-04-07)<a name="0.1.2"></a>


## [0.1.1](https://github.com/tophat/monodeploy/compare/@monodeploy/git@0.1.0...@monodeploy/git@0.1.1) "@monodeploy/git" (2021-03-10)<a name="0.1.1"></a>

### Bug Fixes

* bump versions to release ([#284](https://github.com/tophat/monodeploy/issues/284)) ([dc93dcf](https://github.com/tophat/monodeploy/commits/dc93dcf))


## [0.1.0](https://github.com/tophat/monodeploy/compare/@monodeploy/git@0.0.5...@monodeploy/git@0.1.0) "@monodeploy/git" (2021-03-08)<a name="0.1.0"></a>

### Features

* add topological sort, support for previewing changes ([#273](https://github.com/tophat/monodeploy/issues/273)) ([87b6a00](https://github.com/tophat/monodeploy/commits/87b6a00))
* rename private monodeploy packages for improved readability under scope ([#277](https://github.com/tophat/monodeploy/issues/277)) ([87b6a00](https://github.com/tophat/monodeploy/commits/87b6a00))
