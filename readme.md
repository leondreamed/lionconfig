# @leonzalion/configs

[![npm version](https://img.shields.io/npm/v/@leonzalion/configs)](https://npmjs.com/package/@leonzalion/configs)

## Installation

`@leonzalion/configs` is based on on `pnpm`; it may not necessarily work well with other package managers.

```shell
pnpm add -D @leonzalion/configs
```

Requires the following configuration to be added in VSCode:

```jsonc
{
  // ...
  "prettier.configPath": "./node_modules/@leonzalion/configs/prettier.cjs"
}
```

## Features

1. TypeScript + ESM support out of the box
2. Configurable git hooks using lion-git-hooks
3. Out-of-the-box prettier support with (my) custom config
4. ESLint rules based off [xo](https://github.com/xojs/xo)'s rules with modifications
5. Out-of-the-box markdownlint support
6. Out-of-the-box support path aliases using custom ESM loader with `tsconfig-paths` and `tsc-alias` at build time
7. Extremely simple release script with `lionp`
8. Out-of-the-box commitlint support
9. Out-of-the-box lint-staged support
