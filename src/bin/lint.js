#!/usr/bin/env node

import process from 'node:process';

import { runScript } from '../utils/script.js';

runScript('lint', ['eslint', '--cache', '--fix', ...process.argv.slice(2), '.'], (dir) =>
	fs.existsSync(path.join(dir, '.eslintrc.cjs'))
);
