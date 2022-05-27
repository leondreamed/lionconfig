#!/usr/bin/env node

import { cosmiconfigSync } from 'cosmiconfig';
import { join } from 'desm';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { outdent } from 'outdent';
import { pkgUpSync } from 'pkg-up';

async function prettierWrapper() {
	const defaultPrettierIgnoreFilePath = join(
		import.meta.url,
		'../prettier/.prettierignore'
	);
	const projectDir = path.dirname(pkgUpSync()!);

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

const result = cosmiconfigSync('prettier', {
	stopDir: process.cwd(),
}).search();

const ignorePath = join(import.meta.url, '../prettier/.prettierignore');

const prettierOptions = [`--ignore-path=${ignorePath}`];

if (result === null) {
	prettierOptions.push('--config', join(import.meta.url, '../prettier.cjs'));
}

prettierOptions.push(...argv);

// Overriding argv before importing the Prettier binary
process.argv = [...process.argv.slice(0, 2), ...prettierOptions];
await prettierWrapper();
