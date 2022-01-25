const { spawnSync } = require('child_process');

spawnSync(
	'node',
	[
		'-r',
		'@leonzalion/configs/tsconfig/suppress-experimental-loader-warning.cjs',
		'--loader',
		'@leonzalion/configs/tsconfig/ts-loader.mjs',
		...process.argv.slice(2),
	],
	{
		stdio: 'inherit',
	}
);
