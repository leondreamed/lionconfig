#!/usr/bin/env node

import * as fs from 'node:fs';
import * as path from 'node:path';
import process from 'node:process';

import { runScript } from '../utils/script.js';

runScript({
	name: 'typecheck',
	defaultCommandArgs: ['tsc', '--noEmit', ...process.argv.slice(2)],
	condition: (dir) => fs.existsSync(path.join(dir, 'tsconfig.json')),
});
