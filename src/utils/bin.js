import { dirname } from 'desm';
import { execaSync } from 'execa';
import process from 'node:process';
import resolve from 'resolve';

export function executeBin(packageName, relativeBinPath, args = []) {
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
		}).status
	);
}
