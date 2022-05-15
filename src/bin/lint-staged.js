#!/usr/bin/env node

import { join } from 'desm';

import { executeBin } from '../utils/bin.js';

executeBin('lint-staged', 'bin/lint-staged.js', [
	'--config',
	join(import.meta.url, '../lint-staged.config.cjs'),
]);
