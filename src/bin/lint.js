#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import { runScript } from '../utils/script.js';

runScript(
	'lint',
	['eslint', '--cache', '--fix', ...process.argv.slice(2), '.'],
	(dir) => fs.existsSync(path.join(dir, '.eslintrc.cjs'))
);
