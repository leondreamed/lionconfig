#!/usr/bin/env node

import fs, { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import type { PackageJson } from 'type-fest';

const tscPath = createRequire(import.meta.url).resolve('typescript/lib/tsc');

// When typechecking, we disable writing to the file system
fs.writeSync = () => 0;

fs.readFileSync = ((...args) => {
	if (typeof args[0] === 'string' && path.dirname(args[0]) === 'package.json') {
		// If the `main` or `exports` field in the `package.json` is pointing to a TypeScript file in the `src/` folder, change it to a JavaScript file in the `dist/` folder for type checking support

		const pkgJson = readFileSync(...args);
		const pkg = JSON.parse(String(pkgJson)) as PackageJson;
		if (pkg.main?.endsWith('.ts') && /^(\.\/)?src\//.test(pkg.main)) {
			pkg.main = pkg.main.replace(/^(\.\/)src\//, './dist/');
		}

		return JSON.stringify(pkg);
	} else {
		return readFileSync(...args);
	}
}) as typeof fs.readFileSync;

await import(tscPath);
