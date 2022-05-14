# lionconfig

[![npm version](https://img.shields.io/npm/v/lionconfig)](https://npmjs.com/package/lionconfig)

Powerful configuration defaults for various JavaScript and TypeScript tools.

## Installation

> **Note:** `lionconfig` is based on on `pnpm` and may not work well with other package managers.

```shell
pnpm add -D lionconfig
```

For optimal Prettier support in VSCode, add the following configuration to your VSCode:

```jsonc
{
  // ...
  "prettier.configPath": "./node_modules/lionconfig/prettier.cjs"
}
```

## Features

### TypeScript

TypeScript + ESM support is provided out of the box via a wrapper script named `node-ts` which wraps around `ts-node`'s ESM support with a custom loader hook to support TypeScript path aliases.

In addition, `tsc-alias` is exposed as a binary so you can use it to turn your aliased paths into relative paths at compile time.

### Git Hooks

Git hooks are set with [`lion-git-hooks`](https://github.com/leonzalion/lion-git-hooks). [lint-staged](https://github.com/okonet/lint-staged) is also provided as an out-of-the-box binary

### Prettier

Prettier comes in the form of a wrapper function which comes with a default `.prettierignore` configuration while also allowing you to specify a `.prettierignore` extension which extends the default in your own project.

> Since prettier doesn't yet provide native support for this feature, this feature is added through a prettier wrapper script which makes prettier load a "combined" version of the default `.prettierignore` file and the project's `.prettierignore` file.

### ESLint

ESLint support is provided via a powerful `createESLintConfig` function that you can use like this:

```typescript
const createESLintConfig = require('lionconfig/eslint.cjs');

module.exports = createESLintConfig(__dirname, {
  rules: {
    'unicorn/process-exit': 'off',
    // ...
  },
  // ...add any other custom ESLint options here; they will be merged with the default ESLint configuration
});
```

The default ESLint configuration is based off of [xo](https://github.com/xojs/xo) with some modifications.

### Markdownlint

### Release

[lionp](https://github.com/leonzalion/lionp) is exposed as a binary so you can add the following property to your `package.json`:

```jsonc
{
  // ...
  "publishConfig": {
    "directory": "dist"
  }
}
```

and then running `pnpm release` or `pnpm exec release` will call `lionp`.

### Default Scripts

To reduce boilerplate in the `scripts` property of each codebase's `package.json`, some utility binaries are exposed:

`pnpm exec test`: `vitest run`
`pnpm exec lint`: `eslint --cache --fix .`
`pnpm exec format`: `prettier --write .`
`pnpm exec typecheck`: `tsc --noEmit`
