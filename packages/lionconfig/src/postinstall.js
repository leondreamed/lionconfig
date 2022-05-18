import * as fs from 'node:fs';
import { pkgUpSync } from 'pkg-up';

const pkgJsonPath = = pkgUpSync();

if (pkgJsonPath !== undefined) {
	const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8')) as Record<string, any>;
	if (!pkgJson.scripts?.prepare?.includes('lionconfig') && !pkgJson.lionconfig?.noPrepare) {
		console.error("`lionconfig` was not added to your project's prepare script.")
		process.exit(1);
	}
}

