#!/usr/bin/env node

import dotenv from 'dotenv';
import findUp from 'find-up';
import minimist from 'minimist';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import { nodeTs } from '../utils/node.js';

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

const pnpmWorkspaceYamlPath = findUp.sync('pnpm-workspace.yaml');
// Load environment variables from an `.env` file if they are present
const envFilePath = path.join(
	pnpmWorkspaceYamlPath === undefined
		? process.cwd()
		: path.dirname(pnpmWorkspaceYamlPath),
	'.env'
);

const env = fs.existsSync(envFilePath) ? dotenv.config({ path: envFilePath }).parsed : undefined;

nodeTs(filePath, {
	args: args._.slice(1),
	env,
});
