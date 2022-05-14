# lionconfigs

Powerful configuration defaults for various JavaScript and TypeScript tools.

[![npm version](https://img.shields.io/npm/v/lionconfigs)](https://npmjs.com/package/lionconfigs)

## Installation

`lionconfigs` is based on on `pnpm`; it may not work well with other package managers.

```shell
pnpm add -D lionconfigs
```

For Prettier support in VSCode, add the following configuration to your path:

```jsonc
{
  // ...
  "prettier.configPath": "./node_modules/lionconfigs/prettier.cjs"
}
```

## Features

### TypeScript

TypeScript + ESM support is provided out of the box via a wrapper script named `node-ts` which wraps around `ts-node`'s ESM support with a custom loader hook to support TypeScript path aliases.

### Git Hooks

Git hooks are set with [`lion-git-hooks`](https://github.com/leonzalion/lion-git-hooks).

### Prettier

> **Note:** Currently, there isn't a way to change the prettie

1. TypeScript + ESM support out of the box
2. Configurable git hooks using lion-git-hooks
3. Out-of-the-box prettier support with (my) custom config
4. ESLint rules based off [xo](https://github.com/xojs/xo)'s rules with modifications
5. Out-of-the-box markdownlint support
6. Out-of-the-box support path aliases using custom ESM loader with `tsconfig-paths` and `tsc-alias` at build time
7. Extremely simple release script with `lionp`
8. Out-of-the-box commitlint support
9. Out-of-the-box lint-staged support

