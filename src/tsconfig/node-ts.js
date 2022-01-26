const { spawnSync } = require('child_process');
const path = require('path');
const minimist = require('minimist');

// The path of the project
const projectPath = process.argv[1].slice(
	0,
	process.argv[1].indexOf('/node_modules/')
);

// The first CLI argument that doesn't have an option associated with it
// is the file
const file = minimist(process.argv)._[0];
if (file === undefined) {
	throw new Error('No file specified.');
}

const fileIndex = process.argv.indexOf(fileIndex);
const argv = [...process.argv.slice(2, fileIndex), ...process.argv.slice(fileIndex + 1, process.argv.length)]

spawnSync(
	'node',
	[
		'-r',
		'@leonzalion/configs/tsconfig/suppress-experimental-loader-warning.cjs',
		'--loader',
		'@leonzalion/configs/tsconfig/ts-loader.mjs',
		...argv,
		path.join(projectPath, file),
	],
	{
		stdio: 'inherit',
		cwd: path.join(projectPath, path.dirname(file)),
	}
);
