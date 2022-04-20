import { pathToFileURL } from 'node:url';
import { resolve as resolveTs } from 'ts-node/esm';
import * as tsConfigPaths from 'tsconfig-paths';

const { absoluteBaseUrl, paths } = tsConfigPaths.loadConfig();
const matchPath =
	paths === undefined
		? () => false
		: tsConfigPaths.createMatchPath(absoluteBaseUrl, paths);

export function resolve(specifier, ctx, defaultResolve) {
	if (specifier.endsWith('.js')) {
		// Handle *.js
		const trimmed = specifier.slice(0, Math.max(0, specifier.length - 3));
		const match = matchPath(trimmed);
		if (match) {
			return resolveTs(pathToFileURL(`${match}.js`).href, ctx, defaultResolve);
		}
	} else if (specifier.endsWith('.cjs')) {
		// Handle *.cjs
		const trimmed = specifier.slice(0, Math.max(0, specifier.length - 4));
		const match = matchPath(trimmed);
		if (match) {
			return resolveTs(pathToFileURL(`${match}.cjs`).href, ctx, defaultResolve);
		}
	} else if (specifier.endsWith('.mjs')) {
		// Handle *.cjs
		const trimmed = specifier.slice(0, Math.max(0, specifier.length - 4));
		const match = matchPath(trimmed);
		if (match) {
			return resolveTs(pathToFileURL(`${match}.mjs`).href, ctx, defaultResolve);
		}
	}

	return resolveTs(specifier, ctx, defaultResolve);
}

export { load, transformSource } from 'ts-node/esm';
