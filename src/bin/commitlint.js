#!/usr/bin/env node

import resolve from 'resolve';

import { executeBin } from '../utils/bin.js';

executeBin('@commitlint/cli', 'cli.js', [
	'--config',
	resolve('../commitlint.cjs'),
]);
