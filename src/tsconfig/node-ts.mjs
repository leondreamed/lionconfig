#!/usr/bin/env node

import isCi from 'is-ci';
import logSymbols from 'log-symbols';
import minimist from 'minimist';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import pkgUp from 'pkg-up';

function getProjectDir(pathUrl) {
	const pathDirectory = path.dirname(pathUrl);
	const getPackageJson = (cwd) => {
		const packageJsonPath = pkgUp.sync({ cwd });
		if (packageJsonPath === undefined) {
			throw new Error('No project found.');
		}

		const packageJson = JSON.parse(fs.readFileSync(packageJsonPath).toString());

		return { packageJson, packageJsonPath };
	};

	let { packageJson, packageJsonPath } = getPackageJson(pathDirectory);

	// If the package.json only has "type": "module", search for another one
	while (
		packageJson.type === 'module' &&
		Object.keys(packageJson).length === 1
	) {
		const upperDirectory = path.join(path.dirname(packageJsonPath), '..');
		({ packageJson, packageJsonPath } = getPackageJson(upperDirectory));
	}

	const projectPath = path.dirname(packageJsonPath);
	return projectPath;
}

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

let fileFullPath;
// Absolute path
if (filePath.startsWith('/')) {
	fileFullPath = filePath;
}
// Relative path
else {
	fileFullPath = path.join(process.cwd(), filePath);
}

const nodeOpts = [fileFullPath, ...argv._.slice(1)];

const spawnOptions = {
	stdio: 'inherit',
	// Run `node` from the working directory of the file
	cwd: getProjectDir(fileFullPath),
};

const result = spawnSync(
	'node',
	[
		'-r',
		'@leonzalion/configs/tsconfig/suppress-experimental-loader-warning.cjs',
		'--loader',
		'@leonzalion/configs/tsconfig/ts-loader.mjs',
		...nodeOpts,
	],
	spawnOptions
);

if (process.env.NODE_TS_DEBUG) {
	console.debug(result);
}

if (result.error || result.status !== 0) {
	if (result.error) {
		console.error('Error from node-ts:', result.error);
	}

	if (result.status !== 0 && result.status !== null) {
		console.log(
			logSymbols.error,
			`node-ts: Process exited with exit code ${result.status}`
		);
		process.exit(result.status);
	}
}
