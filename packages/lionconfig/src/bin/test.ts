#!/usr/bin/env node

import * as fs from 'node:fs';
import * as path from 'node:path';
import process from 'node:process';

import { runScript } from '../utils/script.js';

await runScript({
	name: 'test',
	defaultCommandArgs: ['vitest', 'run', ...process.argv.slice(2)],
	condition(dir) {
		const vitestFiles = [
			'vite.config.ts',
			'vite.config.js',
			'vitest.config.js',
			'vitest.config.ts',
		];

		return (
			fs.existsSync(path.join(dir, 'test')) ||
			vitestFiles.some((file) => fs.existsSync(path.join(dir, file)))
		);
	},
});
