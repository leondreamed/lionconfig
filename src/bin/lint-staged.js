#!/usr/bin/env node

import resolve from 'resolve';

import { executeBin } from '../utils/bin.js';

executeBin('lint-staged', 'bin/lint-staged.js', [
	'--config',
	resolve.sync('../lint-staged.config.cjs'),
]);
