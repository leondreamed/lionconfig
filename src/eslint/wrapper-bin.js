/* eslint-disable prefer-destructuring */

/**
	A wrapper around ESLint to provide a default `.eslintrc.cjs` file if the project doesn't contain one.
*/

import fs from 'node:fs';
import path from 'node:path';
import { outdent } from 'outdent';
import resolve from 'resolve';

const eslintPath = resolve.sync('eslint');
const eslintBinPath = path.resolve(eslintPath, '../../bin/eslint.js');

const readFileSync = fs.readFileSync;
const statSync = fs.statSync;
const existsSync = fs.existsSync;

function shouldStubTsconfigEslintJson(filePath) {
	if (path.basename(filePath) !== 'tsconfig.eslint.json') {
		return false;
	}

	const dir = path.dirname(filePath);

	return !existsSync(filePath) && existsSync(path.join(dir, 'tsconfig.json'));
}

if (!fs.__lionConfigStubbed) {
	fs.readFileSync = (...args) => {
		if (shouldStubTsconfigEslintJson(args[0])) {
			return outdent`
				{
					"extends": "./tsconfig.json",
					"include": ["*.*", "**/*.*"]
				}
			`;
		} else {
			return readFileSync(...args);
		}
	};

	fs.statSync = (...args) => {
		if (shouldStubTsconfigEslintJson(args[0])) {
			return {
				isFile: () => true,
			};
		}
		// Otherwise, just pass through
		else {
			return statSync(...args);
		}
	};

	fs.existsSync = (...args) => {
		if (shouldStubTsconfigEslintJson(args[0])) {
			return true;
		} else {
			return existsSync(...args);
		}
	};
}

await import(eslintBinPath);
