#!/usr/bin/env node

const path = require('path');
const process = require('process');

const argv = process.argv.slice(2);

// If the --custom-config is passed, then `prettier` will use its default config resolution algorithm for determining the project config.
let customConfigIndex = argv.indexOf('--custom-config');
if (customConfigIndex !== -1) {
	argv.splice(customConfigIndex, 1);
}

let ignorePath = path.join(__dirname, '../prettier/.prettierignore');
const prettierWrapperBinPath = path.join(
	__dirname,
	'../prettier/wrapper-bin.cjs'
);

const prettierOptions = [`--ignore-path=${ignorePath}`];

if (customConfigIndex !== -1) {
	prettierOptions.push('--config', require.resolve('../prettier.cjs'));
}

prettierOptions.push(argv);

process.exit(
	spawnSync(prettierWrapperBinPath, prettierOptions, {
		stdio: 'inherit',
	}).status
);
