const { spawnSync, spawn } = require('child_process');
const path = require('path');
const minimist = require('minimist');

// The path of the project
const projectPath = process.argv[1].slice(
	0,
	process.argv[1].indexOf('/node_modules/')
);

// The first CLI argument that doesn't have an option associated with it
// is the file
const file = minimist(process.argv.slice(2))._[0];
if (file === undefined) {
	throw new Error('No file specified.');
}

const fileIndex = process.argv.indexOf(file);
const argv = [
	...process.argv.slice(2, fileIndex),
	path.join(projectPath, file),
	...process.argv.slice(fileIndex + 1, process.argv.length),
];

const spawnOptions = {
	stdio: 'inherit',
	cwd: path.join(projectPath, path.dirname(file)),
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
	console.error('Stdout: ', result.stdout?.toString());
	console.error('Stderr: ', result.stderr?.toString());
	console.error('Error: ', result.error);
	console.error('Options: ', spawnOptions);
}
