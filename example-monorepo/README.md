# example-monorepo

Example monorepo used for end to end tests.

There are 3 packages, pkg-1, pkg-2, and pkg-3. The third package imports the second package.

```sh
yarn build
yarn node lib/cli.js --cwd $(realpath ./example-monorepo)
```

Note that you cannot use a relative path for the CWD.
