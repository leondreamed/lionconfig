#!/usr/bin/env node

import { join } from 'desm';
import { spawnSync } from 'node:child_process';
import process from 'node:process';
import resolve from 'resolve';

const argv = process.argv.slice(2);

// If the --custom-config is passed, then `prettier` will use its default config resolution algorithm for determining the project config.
const customConfigIndex = argv.indexOf('--custom-config');
if (customConfigIndex !== -1) {
	argv.splice(customConfigIndex, 1);
}

const ignorePath = join(import.meta.url, '../prettier/.prettierignore');
const prettierWrapperBinPath = join(
	import.meta.url,
	'../prettier/wrapper-bin.cjs'
);

const prettierOptions = [`--ignore-path=${ignorePath}`];

if (customConfigIndex !== -1) {
	prettierOptions.push('--config', resolve.sync('../prettier.cjs'));
}

prettierOptions.push(...argv);

process.exit(
	spawnSync(prettierWrapperBinPath, prettierOptions, {
		stdio: 'inherit',
	}).status
);
