import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import { resolve as importMetaResolve } from 'import-meta-resolve';
import * as fs from 'node:fs';
import { builtinModules } from 'node:module';
import * as path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import type { ExternalOption, Plugin } from 'rollup';
import { rollup } from 'rollup';
import bundleESM from 'rollup-plugin-bundle-esm';
import depsExternal from 'rollup-plugin-deps-external';
import jsImports from 'rollup-plugin-js-imports';
import type { PackageJson } from 'type-fest';

import type { CommonjsBundleOptions } from '~/types/commonjs.js';

interface CreateCommonjsBundleProps {
	pkgPath: string;
	pkg: PackageJson;
	rollupOptions?: CommonjsBundleOptions;
	cwd?: string;
}
/**
	Bundles all dependencies with Rollup to produce a CommonJS bundle
*/
export async function createCommonjsBundle({
	pkgPath,
	pkg,
	rollupOptions,
	cwd = process.cwd(),
}: CreateCommonjsBundleProps) {
	if (pkg.exports === undefined || pkg.exports === null) {
		return pkg;
	}

	const browser = rollupOptions?.browser;
	delete rollupOptions?.browser;

	if (
		typeof pkg.exports !== 'string' &&
		typeof (pkg.exports as Record<string, unknown>)['.'] !== 'string'
	) {
		return pkg;
	}

	const pkgDir = path.dirname(pkgPath);
	const tsconfigPath = path.join(pkgDir, 'tsconfig.json');

	// Weird typing for `plugins` comes from rollup
	const plugins: Array<false | null | undefined | Plugin> = [
		jsImports(),
		bundleESM(),
		depsExternal({ packagePath: pkgPath }),
		json(),
		browser
			? nodeResolve({
					browser: true,
			  })
			: nodeResolve({
					// Need to remove `default` from the list because some libraries have `default` pointing to the browser version of the package
					exportConditions: ['node', 'module', 'import'],
			  }),
		commonjs(),
	];

	if (rollupOptions?.extendPlugins !== undefined) {
		plugins.push(...rollupOptions.extendPlugins);
	}

	if (fs.existsSync(tsconfigPath)) {
		plugins.push(
			typescript({
				tsconfig: tsconfigPath,
				tslib: fileURLToPath(await importMetaResolve('tslib', import.meta.url)),
			})
		);
	}

	let external: ExternalOption = builtinModules.flatMap((module) => [
		module,
		`node:${module}`,
	]);

	if (rollupOptions?.external) {
		if (typeof rollupOptions.external === 'function') {
			external = rollupOptions.external;
		} else {
			external.push(...[rollupOptions.external].flat());
		}
	}

	const pkgImportExport =
		typeof pkg.exports === 'string'
			? pkg.exports
			: (pkg.exports as Record<string, string>)['.']!;

	const bundle = await rollup({
		plugins,
		input: path.join(pkgDir, pkgImportExport),
		...rollupOptions,
		external,
	});

	fs.mkdirSync(path.join(cwd, 'dist'), { recursive: true });

	await bundle.write({
		file: path.join(cwd, 'dist/index.cjs'),
		format: 'commonjs',
		inlineDynamicImports: true,
	});

	const exportsWithoutExtension = path.join(
		path.dirname(pkgImportExport),
		path.parse(pkgImportExport).name
	);

	if (typeof pkg.exports === 'string') {
		pkg.exports = {
			import: `./${exportsWithoutExtension}.js`,
			require: './index.cjs',
		};
	} else {
		pkg.exports = {
			...pkg.exports,
			'.': {
				import: `./${exportsWithoutExtension}.js`,
				require: './index.cjs',
			},
		};
	}
}
