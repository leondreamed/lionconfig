import findUp from 'find-up';
import isPathInside from 'is-path-inside';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve as resolveTs } from 'ts-node/esm';
import * as tsConfigPaths from 'tsconfig-paths';

/**
	@type {Record<string, import('tsconfig-paths').MatchPath>}
*/
const tsconfigPathToMatchPath = {};

// `paths` in `tsconfig.json` are loaded relative to the path of the file being loaded

/**
	@param {string} specifier
	@param {{
		conditions: string[],
		parentURL: string | undefined
	}} context
	@param {Function} defaultResolve
	@returns {Promise<{ url: string }>}
*/
export function resolve(specifier, context, defaultResolve) {
	let tsconfigPath;

	if (context.parentURL !== undefined) {
		const filePathOfImporter = fileURLToPath(context.parentURL);
		// Check all the existing parent folders of each known `tsconfig.json` file and see
		// if the current file's directory falls under a known directory containing a
		// `tsconfig.json` file
		for (const knownTsconfigPath of Object.keys(tsconfigPathToMatchPath)) {
			if (isPathInside(filePathOfImporter, path.dirname(knownTsconfigPath))) {
				tsconfigPath = knownTsconfigPath;
			}
		}

		if (tsconfigPath === undefined) {
			// Could not find an existing `tsconfig.json` which is associated with the current file
			// Thus, find it manually by finding the nearest `tsconfig.json` in an above directory
			const tsconfigJsonPath = findUp.sync('tsconfig.json', {
				cwd: path.dirname(filePathOfImporter),
			});
			if (tsconfigJsonPath !== undefined) {
				const { absoluteBaseUrl, paths } = tsConfigPaths.loadConfig(
					tsconfigJsonPath
				);
				let matchPath;
				if (paths === undefined) {
					matchPath = () => false;
				} else {
					matchPath = tsConfigPaths.createMatchPath(absoluteBaseUrl, paths);
				}

				tsconfigPathToMatchPath[tsconfigJsonPath] = matchPath;

				tsconfigPath = tsconfigJsonPath;
			}
		}
	}

	let matchPath;
	if (tsconfigPath === undefined) {
		const { paths, absoluteBaseUrl } = tsConfigPaths.loadConfig();
		if (paths === undefined) {
			matchPath = () => false;
		} else {
			matchPath = tsConfigPaths.createMatchPath(absoluteBaseUrl, paths);
		}
	} else {
		matchPath = tsconfigPathToMatchPath[tsconfigPath];
	}

	if (specifier.endsWith('.js')) {
		// Handle *.js
		const trimmed = specifier.slice(0, Math.max(0, specifier.length - 3));
		const match = matchPath(trimmed);

		if (match) {
			return resolveTs(
				pathToFileURL(`${match}.js`).href,
				context,
				defaultResolve
			);
		}
	} else if (specifier.endsWith('.cjs')) {
		// Handle *.cjs
		const trimmed = specifier.slice(0, Math.max(0, specifier.length - 4));
		const match = matchPath(trimmed);
		if (match) {
			return resolveTs(
				pathToFileURL(`${match}.cjs`).href,
				context,
				defaultResolve
			);
		}
	} else if (specifier.endsWith('.mjs')) {
		// Handle *.mjs
		const trimmed = specifier.slice(0, Math.max(0, specifier.length - 4));
		const match = matchPath(trimmed);
		if (match) {
			return resolveTs(
				pathToFileURL(`${match}.mjs`).href,
				context,
				defaultResolve
			);
		}
	}

	return resolveTs(specifier, context, defaultResolve);
}

export { load, transformSource } from 'ts-node/esm';
