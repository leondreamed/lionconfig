#!/usr/bin/env node

import { join } from 'desm'

import { executeBin } from '../utils/bin.js'

executeBin('@commitlint/cli', 'cli.js', [
	'--config',
	join(import.meta.url, '../commitlint.cjs'),
])
