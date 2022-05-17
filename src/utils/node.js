import execa from '@commonjs/execa';
import logSymbols from 'log-symbols';
import path from 'node:path';
import process from 'node:process';

export function nodeTs(filePath, cliOptions = {}) {
	let fileFullPath;
	// Absolute path
	if (filePath.startsWith('/')) {
		fileFullPath = filePath;
	}
	// Relative path
	else {
		fileFullPath = path.join(process.cwd(), filePath);
	}

	const nodeOpts = [fileFullPath, ...(cliOptions.args ?? [])];

	const spawnOptions = {
		stdio: 'inherit',
		// Run `node` from the working directory of the file
		cwd: path.dirname(fileFullPath),
		env: cliOptions.env,
		extendEnv: true,
		reject: false,
	};

	const result = execa.sync(
		'node',
		[
			'-r',
			'lionconfig/tsconfig/suppress-experimental-loader-warning.cjs',
			'--loader',
			'lionconfig/tsconfig/ts-loader.js',
			...nodeOpts,
		],
		spawnOptions
	);

	if (process.env.NODE_TS_DEBUG) {
		console.debug(result);
	}

	if (result.error || result.exitCode !== 0) {
		if (result.error) {
			console.error('Error from node-ts:', result.error);
		}

		if (result.exitCode !== 0) {
			console.error(
				logSymbols.error,
				`node-ts: Process exited with exit code ${result.exitCode}`
			);
			process.exit(result.exitCode);
		}
	}
}
