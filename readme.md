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

TypeScript + ESM support is provided out of the box via a wrapper script named `node-ts` which leverages `ts-node`'s ESM support with a custom loader hook to support TypeScript path aliases.

`lionconfig` also provides a default [`tsconfig.json`]() file to extend from with reasonable defaults (including transpilation-by-default using [swc](https://github.com/swc-project/swc)). To use it, simply add the `extends` property in your project's `tsconfig.json`:

```jsonc
{
  "extends": "lionconfig/tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    // ... and add your custom project settings here
  }
}
```

In addition, `tsc-alias` is exposed as a binary so you can use it to turn your aliased paths into relative paths at compile time.

### Git Hooks

Git hooks are set with [`lion-git-hooks`](https://github.com/leonzalion/lion-git-hooks). To add git hooks to your project, create one of the following folders in your project's filesystem:

```shell
hooks
scripts/hooks
scripts/src/hooks
packages/scripts/src/hooks
```

In the `hooks` folder you just created, add a JavaScript/TypeScript file for each hook you want to register. For example, to create a pre-push hook, create a file named `pre-push.ts`:

```typescript
// pre-push.ts

// Change the code below to what you want to run in your pre-push hook
import { prePush } from 'lion-system';

prePush();
```

#### [lint-staged](https://github.com/okonet/lint-staged)

[`lint-staged`](https://github.com/okonet/lint-staged) is also provided as an out-of-the-box-supported binary.

### Prettier

Prettier comes in the form of a wrapper binary which comes with a default `.prettierignore` configuration while also allowing you to specify a custom `.prettierignore` for your project which extends the default.

> Since prettier doesn't yet provide native support for this feature, this feature is added through a custom node script which makes overloads `fs.promises.readFile` to stub a "virtual" `.prettierignore` file that is a "combined" version of the default `.prettierignore` file and the project's `.prettierignore`.

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

The [default ESLint configuration](https://github.com/leonzalion/lionconfig/blob/main/src/eslint/create-eslint-config.cjs) is based off of [xo](https://github.com/xojs/xo) with some modifications.

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

- `pnpm exec test`: `vitest run`
- `pnpm exec lint`: `eslint --cache --fix .`
- `pnpm exec format`: `prettier --write .`
- `pnpm exec typecheck`: `tsc --noEmit`

When run from the workspace root, these scripts will intelligently run recursively based on the contents of the workspace packages (e.g. `typecheck` will only run in workspace packages that have a `tsconfig.json` file).

To override these default scripts, simply add a script with the same name in the project's `package.json`:

```jsonc
{
  "scripts": {
     "typecheck": "vue-tsc --noEmit"
  }
  // ...
}
```

and then `pnpm exec typecheck` will run `vue-tsc --noEmit` instead of the default `tsc --noEmit`.

### Utility Scripts

If you create scripts in a `src/bin` folder, instead of running:

```shell
pnpm exec node-ts ./src/bin/my-cli.ts
```

`lionconfig` provides a `run-bin` script so you can run:

```shell
pnpm exec run-bin my-cli
```
