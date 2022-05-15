#!/usr/bin/env node

import * as fs from 'node:fs';
import * as path from 'node:path';
import process from 'node:process';

import { runScript } from '../utils/script.js';

runScript(['tsc', '--noEmit', ...process.argv.slice(2)], (dir) =>
	fs.existsSync(path.join(dir, 'tsconfig.json'))
);
