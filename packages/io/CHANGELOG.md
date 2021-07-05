# Changelog

<!-- MONODEPLOY:BELOW -->

## [0.2.14](https://github.com/tophat/monodeploy/compare/@monodeploy/io@0.2.13...@monodeploy/io@0.2.14) "@monodeploy/io" (2021-07-05)<a name="0.2.14"></a>

### Bug Fixes

* update yarn to 3.0.0-rc.9 (#386) ([fcfc63a](https://github.com/tophat/monodeploy/commits/fcfc63a))




## [0.2.13](https://github.com/tophat/monodeploy/compare/@monodeploy/io@0.2.12...@monodeploy/io@0.2.13) "@monodeploy/io" (2021-07-05)<a name="0.2.13"></a>

### Bug Fixes

* refactor APIs to support non-latest dist tag (#374) ([a5c703e](https://github.com/tophat/monodeploy/commits/a5c703e))
* use and support repository url with subdirectories (#384) ([a5c703e](https://github.com/tophat/monodeploy/commits/a5c703e))




## [0.2.12](https://github.com/tophat/monodeploy/compare/@monodeploy/io@0.2.11...@monodeploy/io@0.2.12) "@monodeploy/io" (2021-06-11)<a name="0.2.12"></a>

### Bug Fixes

* do not update devDependencies when patching package.jsons

devDependencies do not need to be updated as they are not used externally, and therefore have no impact on the public API and behaviour ([b2d532d](https://github.com/tophat/monodeploy/commits/b2d532d))
* do not update devDependencies when patching package.jsons (#358) ([b2d532d](https://github.com/tophat/monodeploy/commits/b2d532d))
* preserve workspace protocol when persisting package.json to disk ([b2d532d](https://github.com/tophat/monodeploy/commits/b2d532d))
* preserve workspace protocol when persisting package.json to disk (#359) ([b2d532d](https://github.com/tophat/monodeploy/commits/b2d532d))




## [0.2.10](https://github.com/tophat/monodeploy/compare/@monodeploy/io@0.2.9...@monodeploy/io@0.2.10) "@monodeploy/io" (2021-06-06)<a name="0.2.10"></a>

### Performance Improvements

* update yarn dependencies ([ef6f096](https://github.com/tophat/monodeploy/commits/ef6f096))
* update yarn dependencies (#348) ([ef6f096](https://github.com/tophat/monodeploy/commits/ef6f096))




## [0.2.7](https://github.com/tophat/monodeploy/compare/@monodeploy/io@0.2.6...@monodeploy/io@0.2.7) "@monodeploy/io" (2021-04-28)<a name="0.2.7"></a>


## [0.2.6](https://github.com/tophat/monodeploy/compare/@monodeploy/io@0.2.5...@monodeploy/io@0.2.6) "@monodeploy/io" (2021-04-12)<a name="0.2.6"></a>

### Bug Fixes

* target yarn v3 release candidate ([#304](https://github.com/tophat/monodeploy/issues/304)) ([d90765c](https://github.com/tophat/monodeploy/commits/d90765c))


## [0.2.5](https://github.com/tophat/monodeploy/compare/@monodeploy/io@0.2.4...@monodeploy/io@0.2.5) "@monodeploy/io" (2021-04-12)<a name="0.2.5"></a>

### Bug Fixes

* **node:** skip incompatible plugins ([#303](https://github.com/tophat/monodeploy/issues/303)) ([ba80bae](https://github.com/tophat/monodeploy/commits/ba80bae))


## [0.2.4](https://github.com/tophat/monodeploy/compare/@monodeploy/io@0.2.3...@monodeploy/io@0.2.4) "@monodeploy/io" (2021-04-09)<a name="0.2.4"></a>

### Bug Fixes

* do not trigger unnecessary workspace setup ([#300](https://github.com/tophat/monodeploy/issues/300)) ([aad5925](https://github.com/tophat/monodeploy/commits/aad5925))


## [0.2.3](https://github.com/tophat/monodeploy/compare/@monodeploy/io@0.2.2...@monodeploy/io@0.2.3) "@monodeploy/io" (2021-04-09)<a name="0.2.3"></a>

### Bug Fixes

* **publish:** upload to npm the most recent package manifest ([#299](https://github.com/tophat/monodeploy/issues/299)) ([4fb8f46](https://github.com/tophat/monodeploy/commits/4fb8f46))


## [0.2.2](https://github.com/tophat/monodeploy/compare/@monodeploy/io@0.2.1...@monodeploy/io@0.2.2) "@monodeploy/io" (2021-04-07)<a name="0.2.2"></a>


## [0.2.1](https://github.com/tophat/monodeploy/compare/@monodeploy/io@0.2.0...@monodeploy/io@0.2.1) "@monodeploy/io" (2021-03-10)<a name="0.2.1"></a>

### Bug Fixes

* bump versions to release ([#284](https://github.com/tophat/monodeploy/issues/284)) ([dc93dcf](https://github.com/tophat/monodeploy/commits/dc93dcf))


## [0.2.0](https://github.com/tophat/monodeploy/compare/@monodeploy/io@0.1.1...@monodeploy/io@0.2.0) "@monodeploy/io" (2021-03-08)<a name="0.2.0"></a>

### Features

* add topological sort, support for previewing changes ([#273](https://github.com/tophat/monodeploy/issues/273)) ([87b6a00](https://github.com/tophat/monodeploy/commits/87b6a00))
* rename private monodeploy packages for improved readability under scope ([#277](https://github.com/tophat/monodeploy/issues/277)) ([87b6a00](https://github.com/tophat/monodeploy/commits/87b6a00))
