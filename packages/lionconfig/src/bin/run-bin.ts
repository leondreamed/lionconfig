#!/usr/bin/env node

import dotenv from 'dotenv';
import minimist from 'minimist';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import { nodeTs } from '../utils/node.js';
import { findWorkspaceOfPackage } from '../utils/pnpm.js';

const args = minimist(process.argv.slice(2));
let fileName = args._[0];

if (fileName === undefined) {
	throw new Error('A file name must be specified.');
}

if (path.parse(fileName).ext === '') {
	fileName += '.ts';
}

let filePath = fileName;
// If the user didn't explicitly specify `./src/bin`, we specify it for them
if (!fileName.startsWith('./src/bin') && !fileName.startsWith('src/bin')) {
	filePath = `./src/bin/${fileName}`;
}

const workspace = await findWorkspaceOfPackage('pnpm-workspace.yaml');

let envFilePath: string;
if (workspace === undefined) {
	envFilePath = path.join(process.cwd(), '.env');
} else {
	envFilePath = path.join(workspace.path, '.env');
}

// Load environment variables from an `.env` file if they are present
const env = fs.existsSync(envFilePath)
	? dotenv.config({ path: envFilePath }).parsed
	: undefined;

nodeTs(filePath, {
	args: args._.slice(1),
	resolvePkgFromFile: false,
	env,
});
