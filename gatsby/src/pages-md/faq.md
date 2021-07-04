---
slug: '/faq'
title: 'Frequently Asked Questions - Monodeploy'
---

## FAQ

### Can I use monodeploy for non-JavaScript projects?

Yes. The only requirement is that you organize your project using Yarn Berry (i.e. Yarn v2+). You can create a minimal Yarn project by creating a root `package.json` and then one `package.json` per package/workspace. In this scenario, you likely want to use the "No Registry" mode.

Although designed for publishing to NPM, you can disable all npm interactions by passing in a `--no-registry` flag to the CLI or enabling `noRegistry` in your config file. Note that this is different than enabling dry-run, in that even reads from npm are disabled. If using "No Registry" mode, you should also enable `--persistVersions` (`persistVersions`) and commit the modified package.json files to your repository, otherwise there's no proper reference for the package versions.

### How can I preview changes before publishing?

You can run:

```bash
yarn monodeploy --dry-run --changeset-filename=-
```

to implicitly disable logs and only output the changeset data. This is useful for previewing changes or determining which packages will be modified from a Pull Request.
