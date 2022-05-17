#!/usr/bin/env node

import { join } from 'desm';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { outdent } from 'outdent';
import pkgUp from 'pkg-up';
import resolve from 'resolve';

async function prettierWrapper() {
	const defaultPrettierIgnoreFilePath = join(
		import.meta.url,
		'.prettierignore'
	);
	const projectDir = path.dirname(pkgUp.sync()!);

	// Wrapping around prettier in order to support extended `.prettierignore` files

	const readFileAsync = fs.promises.readFile;

	// prettier uses `fs.promises` to read files: https://github.com/prettier/prettier/blob/main/src/utils/get-file-content-or-null.js

	fs.promises.readFile = (async (filename, encoding) => {
		if (filename === defaultPrettierIgnoreFilePath) {
			let defaultPrettierIgnore = await readFileAsync(filename, encoding);

			// This is ugly but it's the only way to prevent Prettier from ignoring the `temp` folder during
			// testing
			if (process.env.VITEST) {
				defaultPrettierIgnore = String(defaultPrettierIgnore).replace(
					/^temp$/m,
					''
				);
			}

			const projectPrettierIgnorePath = path.join(
				projectDir,
				'.prettierignore'
			);
			// Check if the user has a .prettierignore in their project
			if (fs.existsSync(projectPrettierIgnorePath)) {
				const projectPrettierIgnore = await readFileAsync(
					projectPrettierIgnorePath,
					'utf8'
				);
				return outdent`
					${defaultPrettierIgnore}
					${projectPrettierIgnore}
				`;
			} else {
				return defaultPrettierIgnore;
			}
		} else {
			return readFileAsync(filename, encoding);
		}
	}) as typeof fs.promises.readFile;

	// @ts-expect-error: Prettier doesn't export the type of their `bin-prettier.js` file
	await import('prettier/bin-prettier.js');
}

const argv = process.argv.slice(2);

// If the --custom-config is passed, then `prettier` will use its default config resolution algorithm for determining the project config.
const customConfigIndex = argv.indexOf('--custom-config');
const hasCustomConfig = customConfigIndex !== -1;
if (hasCustomConfig) {
	argv.splice(customConfigIndex, 1);
}

const ignorePath = join(import.meta.url, '../prettier/.prettierignore');

const prettierOptions = [`--ignore-path=${ignorePath}`];

if (!hasCustomConfig) {
	prettierOptions.push('--config', resolve.sync('../prettier.cjs'));
}

prettierOptions.push(...argv);

// Overriding argv before importing the Prettier binary
process.argv = [...process.argv.slice(0, 2), ...prettierOptions];
await prettierWrapper();
