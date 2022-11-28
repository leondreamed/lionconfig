#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'

import { runScript } from '../utils/script.js'

await runScript({
	name: 'lint',
	defaultCommandArgs: ['turbo', 'typecheck', '--continue'],
	condition: (dir) => fs.existsSync(path.join(dir, '.eslintrc.cjs')),
})
