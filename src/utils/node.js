import logSymbols from 'log-symbols';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

export function nodeTs(filePath, cliOptions = []) {
	let fileFullPath;
	// Absolute path
	if (filePath.startsWith('/')) {
		fileFullPath = filePath;
	}
	// Relative path
	else {
		fileFullPath = path.join(process.cwd(), filePath);
	}

	const nodeOpts = [fileFullPath, ...cliOptions];

	const spawnOptions = {
		stdio: 'inherit',
		// Run `node` from the working directory of the file
		cwd: path.dirname(fileFullPath),
	};

	const result = spawnSync(
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

	if (result.error || result.status !== 0) {
		if (result.error) {
			console.error('Error from node-ts:', result.error);
		}

		if (result.status !== 0 && result.status !== null) {
			console.error(
				logSymbols.error,
				`node-ts: Process exited with exit code ${result.status}`
			);
			process.exit(result.status);
		}
	}
}
