#!/usr/bin/env node

import minimist from 'minimist';
import path from 'node:path';
import process from 'node:process';

import { nodeTs } from '../utils/node.js';

const args = minimist(process.argv.slice(2));
let fileName = args._[0];

if (fileName === undefined) {
	throw new Error('A file name must be specified.');
}

if (path.parse(fileName).ext === undefined) {
	fileName += '.ts';
}

let filePath = fileName;
// If the user didn't explicitly specify `./src/bin`, we specify it for them
if (!fileName.startsWith('./src/bin') && !fileName.startsWith('src/bin')) {
	filePath = `./src/bin/${fileName}`;
}

nodeTs(filePath, args._.slice(1));
