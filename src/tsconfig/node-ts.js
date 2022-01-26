const { spawnSync } = require('child_process');
const path = require('path');

// The path of the project
const projectPath = process.argv[1].slice(
	0,
	process.argv[1].indexOf('/node_modules/')
);

// The file to run
const file = process.argv.at(-1);

spawnSync(
	'node',
	[
		'-r',
		'@leonzalion/configs/tsconfig/suppress-experimental-loader-warning.cjs',
		'--loader',
		'@leonzalion/configs/tsconfig/ts-loader.mjs',
		...process.argv.slice(2, -1),
		path.join(projectPath, file),
	],
	{
		stdio: 'inherit',
		cwd: path.join(projectPath, path.dirname(process.argv[2])),
	}
);
