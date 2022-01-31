const { spawnSync } = require('child_process');
const path = require('path');
const minimist = require('minimist');
const logSymbols = require('log-symbols');

// The first CLI argument that doesn't have an option associated with it
// is the file
const filePath = minimist(process.argv.slice(2))._[0];
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

const filePathIndex = process.argv.indexOf(filePath);
const argv = [
	...process.argv.slice(2, filePathIndex),
	fileFullPath,
	...process.argv.slice(filePathIndex + 1, process.argv.length),
];

const spawnOptions = {
	stdio: 'inherit',
	// Run `node` from the working directory of the file
	cwd: path.dirname(fileFullPath),
};

const result = spawnSync(
	'node',
	[
		'-r',
		'@leonzalion/configs/tsconfig/suppress-experimental-loader-warning.cjs',
		'--loader',
		'@leonzalion/configs/tsconfig/ts-loader.mjs',
		...argv,
	],
	spawnOptions
);

if (result.error || result.status !== 0) {
	if (result.error) {
		console.error('Error from node-ts: ', result.error);
	}

	if (result.status !== 0) {
		console.log(
			logSymbols.error,
			`node-ts: Process exited with exit code ${result.status}`
		);
		process.exit(result.status);
	}
}
