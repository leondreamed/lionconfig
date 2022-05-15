#!/usr/bin/env node

import isCi from 'is-ci';
import minimist from 'minimist';
import process from 'node:process';

import { nodeTs } from '../utils/node.js';

const argv = minimist(process.argv.slice(2));

if ((argv['no-ci'] && isCi) || (argv['ci-only'] && !isCi)) {
	process.exit(0);
}

// The first CLI argument that doesn't have an option associated with it
// is the file (thus if the user wants to use node options, they should place
// those options after -- (e.g. `node-ts my-file.ts -- --node-opt1 --node-opt-2`)
const filePath = argv._[0];
if (filePath === undefined) {
	throw new Error('No file specified.');
}

await nodeTs(filePath, argv._.slice(1));
