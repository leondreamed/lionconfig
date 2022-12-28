#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'

import { runScript } from '../utils/script.js'

const files = process.argv.slice(2).filter((arg) => !arg.startsWith('-'))
const options = process.argv.slice(2).filter((arg) => arg.startsWith('-'))

const defaultCommandArgs = ['eslint', '--cache', '--fix', ...options]

if (files.length === 0) {
	defaultCommandArgs.push('.')
} else {
	defaultCommandArgs.push(...files)
}

await runScript({
	name: 'lint',
	defaultCommandArgs,
	condition: (dir) => fs.existsSync(path.join(dir, '.eslintrc.cjs')),
})
