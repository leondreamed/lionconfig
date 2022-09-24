import process from 'node:process';

import { dirname } from 'desm';
import { execaSync } from 'execa';
import resolve from 'resolve';

export function executeBin(
	packageName: string,
	relativeBinPath: string,
	args: string[] = []
) {
	const binPath = resolve.sync(packageName, {
		basedir: dirname(import.meta.url),
		packageFilter(pkg) {
			pkg.main = relativeBinPath;
			return pkg;
		},
	});

	process.exit(
		execaSync(binPath, [...args, ...process.argv.slice(2)], {
			stdio: 'inherit',
			reject: false,
		}).exitCode
	);
}
