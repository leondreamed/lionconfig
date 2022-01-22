import { resolve as resolveTs } from 'ts-node/esm';
import * as tsConfigPaths from 'tsconfig-paths';
import { pathToFileURL } from 'url';

const { absoluteBaseUrl, paths } = tsConfigPaths.loadConfig();
const matchPath = paths === undefined ? () => false : tsConfigPaths.createMatchPath(absoluteBaseUrl, paths);

export function resolve(specifier, ctx, defaultResolve) {
	if (specifier.endsWith('.js')) {
		// Handle *.js
		const trimmed = specifier.substring(0, specifier.length - 3);
		const match = matchPath(trimmed);
		if (match)
			return resolveTs(pathToFileURL(`${match}.js`).href, ctx, defaultResolve);
	}
	return resolveTs(specifier, ctx, defaultResolve);
}

export { load, transformSource } from 'ts-node/esm';
