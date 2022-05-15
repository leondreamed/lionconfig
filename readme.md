# lionconfig

[![npm version](https://img.shields.io/npm/v/lionconfig)](https://npmjs.com/package/lionconfig)

Powerful configuration defaults for various JavaScript and TypeScript tools.

## Installation

> **Note:** `lionconfig` is based on on `pnpm` and may not work well with other package managers.

```shell
pnpm add -D lionconfig
```

For optimal Prettier support in VSCode, add the following configuration to your VSCode settings:

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
const createESLintConfig = require('lionconfig/eslint');

module.exports = createESLintConfig(__dirname, {
  rules: {
    'unicorn/process-exit': 'off',
    // ...
  },
  // ...add any other custom ESLint options here; they will be merged with the default ESLint configuration
});
```

The default ESLint configuration is based off of [xo](https://github.com/xojs/xo) with some modifications.

To prevent unnecessary boilerplate in projects, `lionconfig` provides a wrapper over the ESLint binary which stubs certain files that aren't present in a folder:

#### `tsconfig.eslint.json`

When using ESLint with TypeScript, projects usually need to add a separate `tsconfig.eslint.json` file with the `includes` property set to all files they want to lint in order to avoid the `"Parsing error: "parserOptions.project" has been set for @typescript-eslint/parser"` error from `typescript-eslint`. To avoid this boilerplate, `lionconfig` wraps the ESLint binary and mocks the `fs.readFileSync` function to provide a "virtual" `tsconfig.eslint.json` file so that end users don't need to specify this file in all of their projects when using ESLint with TypeScript.

### Markdownlint

Markdownlint support is also provided out-of-the-box.

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
