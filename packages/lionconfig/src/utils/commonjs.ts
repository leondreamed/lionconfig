/* eslint-disable @typescript-eslint/no-unsafe-call */

import * as fs from 'node:fs'
import { builtinModules } from 'node:module'
import * as path from 'node:path'
import process from 'node:process'

import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import type { ExternalOption, Plugin } from 'rollup'
import { rollup } from 'rollup'
import bundleESM from 'rollup-plugin-bundle-esm'
import depsExternal from 'rollup-plugin-deps-external'
import esbuild from 'rollup-plugin-esbuild'
// @ts-expect-error: bad types
import workspaceImports from 'rollup-plugin-workspace-imports'
import jsImports from 'rollup-plugin-js-imports'
import type { PackageJson } from 'type-fest'

import type { CommonjsBundleOptions } from '~/types/commonjs.js'

interface CreateCommonjsBundlesProps {
	pkgPath: string
	pkg: PackageJson
	rollupOptions?: CommonjsBundleOptions
	cwd?: string
}
/**
	Bundles all dependencies with Rollup to produce a CommonJS bundle
*/
export async function createCommonjsBundles({
	pkgPath,
	pkg,
	rollupOptions,
	cwd = process.cwd(),
}: CreateCommonjsBundlesProps): Promise<void> {
	if (pkg.exports === undefined || pkg.exports === null) {
		console.info(
			'The `exports` property of `package.json` was not set; skipping creation of CommonJS bundles'
		)
		return
	}

	const browser = rollupOptions?.browser
	delete rollupOptions?.browser

	const entryPoints: Array<{ sourcePath: string; destinationPath: string }> = []
	if (typeof pkg.exports === 'string') {
		entryPoints.push({ sourcePath: '.', destinationPath: pkg.exports })
	} else {
		const exportsKeys = Object.entries(pkg.exports)
		for (const [exportsKey, exportsValue] of exportsKeys) {
			if (exportsKey.startsWith('.')) {
				if (exportsValue === null) continue

				// We don't support star paths
				if (exportsKey.includes('*')) continue

				if (typeof exportsValue === 'string') {
					if (pkg.type === 'module') {
						if (!/\.(ts|js|mjs)$/.test(exportsValue)) continue
					} else {
						if (!/\.(ts|mjs)$/.test(exportsValue)) continue
					}

					entryPoints.push({
						sourcePath: exportsKey,
						destinationPath: exportsValue,
					})
				} else if (
					'import' in exportsValue &&
					typeof exportsValue.import === 'string'
				) {
					if (pkg.type === 'module') {
						if (!/\.(ts|js|mjs)$/.test(exportsValue.import)) continue
					} else {
						if (!/\.(ts|mjs)$/.test(exportsValue.import)) continue
					}

					entryPoints.push({
						sourcePath: exportsKey,
						destinationPath: exportsValue.import,
					})
				}
			} else if (exportsKey === 'import' && typeof exportsValue === 'string') {
				if (pkg.type === 'module') {
					if (!/\.(ts|js|mjs)$/.test(exportsValue)) continue
				} else {
					if (!/\.(ts|mjs)$/.test(exportsValue)) continue
				}

				entryPoints.push({ sourcePath: '.', destinationPath: exportsValue })
			}
		}
	}

	const pkgDir = path.dirname(pkgPath)
	const tsconfigPath = path.join(pkgDir, 'tsconfig.json')

	// Weird typing for `plugins` comes from rollup
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	const plugins: Array<false | null | undefined | Plugin> = [
		workspaceImports(),
		jsImports(),
		bundleESM(),
		depsExternal({ packagePath: pkgPath }),
		(json as any)(),
		browser
			? nodeResolve({
					browser: true,
			  })
			: nodeResolve({
					// Need to remove `default` from the list because some libraries have `default` pointing to the browser version of the package
					exportConditions: ['node', 'module', 'import'],
			  }),
		(commonjs as any)(),
		(esbuild as any)({
			tsconfig: tsconfigPath,
		}),
	]

	if (rollupOptions?.extendPlugins !== undefined) {
		plugins.push(...rollupOptions.extendPlugins)
	}

	let external: ExternalOption = builtinModules.flatMap((module) => [
		module,
		`node:${module}`,
	])

	if (rollupOptions?.external) {
		if (typeof rollupOptions.external === 'function') {
			external = rollupOptions.external
		} else {
			external.push(...[rollupOptions.external].flat())
		}
	}

	await Promise.all(
		entryPoints.map(async (entryPoint) => {
			const commonjsDestinationPath = entryPoint.destinationPath
				.replace(/\/src\//, '/')
				.replace(/\.(m|c)?ts$/, '.cjs')
			await fs.promises.mkdir(path.join(cwd, 'dist'), { recursive: true })
			const bundle = await rollup({
				plugins,
				input: path.join(pkgDir, entryPoint.destinationPath),
				output: {
					file: path.join(cwd, 'dist', commonjsDestinationPath),
					format: 'commonjs',
					inlineDynamicImports: true,
				},
				...rollupOptions,
				external,
			})
			await bundle.write({
				file: path.join(cwd, 'dist', commonjsDestinationPath),
				format: 'commonjs',
			})
		})
	)

	const exportsObject: Record<
		string,
		{ types: string; import: string; require: string }
	> = {}

	for (const entryPoint of entryPoints) {
		const entryPointFileName = path.parse(entryPoint.destinationPath).name
		exportsObject[entryPoint.sourcePath] = {
			types: `./${entryPointFileName}.d.ts`,
			import: `./${entryPointFileName}.js`,
			require: `./${entryPointFileName}.cjs`,
		}
	}

	// Adding the subpath exports of the exports we didn't transform
	if (typeof pkg.exports === 'object') {
		for (const [exportKey, exportValue] of Object.entries(pkg.exports)) {
			if (
				!entryPoints.some((entryPoint) => entryPoint.sourcePath === exportKey)
			) {
				// @ts-expect-error: correct type
				exportsObject[exportKey] = exportValue
			}
		}
	}

	pkg.exports = exportsObject
}
