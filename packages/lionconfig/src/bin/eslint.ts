#!/usr/bin/env node

/**
	A wrapper around ESLint to provide a default `.eslintrc.cjs` file if the project doesn't contain one.
*/

import type { PathOrFileDescriptor } from 'node:fs';
import fs from 'node:fs';
import path from 'node:path';
import { outdent } from 'outdent';
import resolve from 'resolve';

const eslintPath = resolve.sync('eslint');
const eslintBinPath = path.resolve(eslintPath, '../../bin/eslint.js');

const readFileSync = fs.readFileSync;
const statSync = fs.statSync;
const existsSync = fs.existsSync;

function shouldStubTsconfigEslintJson(filePath: PathOrFileDescriptor) {
	if (typeof filePath === 'number') {
		return false;
	}

	filePath = String(filePath);

	if (path.basename(filePath) !== 'tsconfig.eslint.json') {
		return false;
	}

	const dir = path.dirname(filePath);

	return !existsSync(filePath) && existsSync(path.join(dir, 'tsconfig.json'));
}

if (!(fs as any).__lionConfigStubbed) {
	fs.readFileSync = ((...args) => {
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
	}) as typeof fs.readFileSync;

	// @ts-expect-error: statSync is considered readonly by TypeScript
	fs.statSync = (...args) => {
		if (shouldStubTsconfigEslintJson(args[0])) {
			return {
				isFile: () => true,
			};
		}
		// Otherwise, just pass through
		else {
			// @ts-expect-error: TypeScript complains because of `statSync`'s overloads
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
