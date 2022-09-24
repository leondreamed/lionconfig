import path from 'node:path';
import process from 'node:process';

import execa from '@commonjs/execa';
import logSymbols from 'log-symbols';
import { pkgUpSync } from 'pkg-up';

type NodeTSOptions = {
	args?: string[];
	env?: Record<string, string>;
	resolvePkgFromFile?: boolean;
};

export function nodeTs(filePath: string, options: NodeTSOptions = {}) {
	let fileFullPath;
	// Absolute path
	if (filePath.startsWith('/')) {
		fileFullPath = filePath;
	}
	// Relative path
	else {
		fileFullPath = path.join(process.cwd(), filePath);
	}

	const nodeOpts = [fileFullPath, ...(options.args ?? [])];

	let pkgJsonPath: string | undefined;
	if (options.resolvePkgFromFile) {
		pkgJsonPath = pkgUpSync({ cwd: path.dirname(fileFullPath) });
	} else {
		pkgJsonPath = pkgUpSync({ cwd: process.cwd() });
	}

	const spawnOptions = {
		stdio: 'inherit',
		cwd: pkgJsonPath === undefined ? process.cwd() : path.dirname(pkgJsonPath),
		env: options.env,
		extendEnv: true,
		reject: false,
	} as const;

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

	if (result.failed || result.exitCode !== 0) {
		if (result.stderr) {
			console.error('Error from node-ts:', result.stderr);
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
