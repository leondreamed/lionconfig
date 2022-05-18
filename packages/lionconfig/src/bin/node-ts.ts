#!/usr/bin/env node

import { program } from 'commander';
import isCi from 'is-ci';
import process from 'node:process';

import { nodeTs } from '../utils/node.js';

program
	.option('--no-ci', "don't run on CI")
	.option('--ci-only', 'only run on CI')
	.option(
		'--resolve-pkg-from-file',
		'determine the working directory to run the file based on the file location'
	)
	.argument('<file>', 'the path to the file to run')
	.showHelpAfterError()
	.allowExcessArguments()
	.allowUnknownOption()
	.parse();

const opts = program.opts<{
	noCi: boolean;
	ciOnly: boolean;
	resolvePkgFromFile: boolean;
}>();

if ((opts.noCi && isCi) || (opts.ciOnly && !isCi)) {
	process.exit(0);
}

// The first CLI argument that doesn't have an option associated with it
// is the file (thus if the user wants to use node options, they should place
// those options after -- (e.g. `node-ts my-file.ts -- --node-opt1 --node-opt-2`)
const filePath = program.args[0];
if (filePath === undefined) {
	throw new Error('No file specified.');
}

nodeTs(filePath, { args: program.args.slice(1) });
