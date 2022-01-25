const execa = require('execa');

execa.sync(
	'node',
	[
		'-r',
		'@leonzalion/configs/tsconfig/suppress-experimental-loader-warning.cjs',
		'--loader',
		'@leonzalion/configs/tsconfig/ts-loader.mjs',
		...process.argv.slice(1),
	],
	{
		stdio: 'inherit',
	}
);
