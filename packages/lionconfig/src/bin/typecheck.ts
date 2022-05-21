#!/usr/bin/env node

import * as fs from 'node:fs';
import * as path from 'node:path';
import process from 'node:process';

import { runScript } from '../utils/script.js';
import { parse as parseTsConfig } from 'tsconfig';

// Run the root-level special tsc-check if the root `tsconfig.json` uses references.
if (fs.existsSync('tsconfig.json')) {
	const tsconfigJson = parseTsconfig(fs.readFileSync('tsconfig.json', 'utf8')) as {
		files?: string[];
		references?: string[];
	};

	if (
		tsconfigJson.files !== undefined &&
		tsconfigJson.files.length === 0 &&
		tsconfigJson.references !== undefined &&
		tsconfigJson.references.length > 0
	) {
		await import('./tsc-check.js');
		process.exit(0);
	}
}

// Otherwise, run a recursive `typecheck` script
await runScript({
	name: 'typecheck',
	defaultCommandArgs: ['tsc', '--noEmit', ...process.argv.slice(2)],
	condition: (dir) => fs.existsSync(path.join(dir, 'tsconfig.json')),
});
