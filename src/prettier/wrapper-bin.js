#!/usr/bin/env node

import { join } from 'desm';
import fs from 'node:fs';
import path from 'node:path';
import { outdent } from 'outdent';
import pkgUp from 'pkg-up';

const defaultPrettierIgnoreFilePath = join(import.meta.url, '.prettierignore');
const projectDir = path.dirname(pkgUp.sync());

/**
	A wrapper around prettier in order to support extended `.prettierignore` files
*/

const readFileAsync = fs.promises.readFile;

// prettier uses `fs.promises` to read files: https://github.com/prettier/prettier/blob/main/src/utils/get-file-content-or-null.js
fs.promises.readFile = async (filename, encoding) => {
	if (filename === defaultPrettierIgnoreFilePath) {
		const defaultPrettierIgnore = await readFileAsync(filename, encoding);

		const projectPrettierIgnorePath = path.join(projectDir, '.prettierignore');
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
};

await import('prettier/bin-prettier.js');
