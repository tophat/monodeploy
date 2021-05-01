# Changelog

All notable changes to this project will be documented using a format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

> We now generate a changelog per individual package. Please check the packages directory for the individual changelogs.

<!-- MONODEPLOY:BELOW -->

## 2.0.0 "monodeploy" (2021-01-26)<a name="2.0.0"></a>

**BREAKING CHANGE**: Major rewrite of monodeploy. It is now a wrapper around Yarn Berry's API, and operates directly on yarn workspaces rather than lerna. It is no longer compatible with lerna monorepos. Migration instructions are available in the README. The API and CLI interface have completely changed. Please refer to the documentation for the new usage.

## 1.0.0 (2020-09-18)<a name="1.0.0"></a>

* first stable release, as a wrapper around lerna
