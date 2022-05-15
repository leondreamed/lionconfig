#!/usr/bin/env node

import { join } from 'desm';

import { executeBin } from '../utils/bin.js';

executeBin('markdownlint-cli', 'markdownlint.js', [
	'--config',
	join(import.meta.url, '../markdownlint.json'),
]);
