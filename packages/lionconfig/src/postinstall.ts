import findUp from 'find-up';
import { updateJsonFile } from 'lion-utils';
import * as fs from 'node:fs';
import * as path from 'node:path';
import process from 'node:process';
import type { PackageJson } from 'type-fest';

const pnpmWorkspacePath = findUp.sync('pnpm-workspace.yaml');

let projectDir: string;
if (pnpmWorkspacePath === undefined) {
	projectDir = process.cwd();
} else {
	projectDir = path.dirname(pnpmWorkspacePath);
}

const pkgJsonPath = path.join(projectDir, 'package.json');

interface LionconfigConfiguration {
	noPrepare: boolean;
}

if (fs.existsSync(pkgJsonPath)) {
	const pkgJson = JSON.parse(
		fs.readFileSync(pkgJsonPath, 'utf8')
	) as PackageJson & { lionconfig?: LionconfigConfiguration };

	if (
		!pkgJson.scripts?.prepare?.includes('lionconfig') &&
		!pkgJson.lionconfig?.noPrepare
	) {
		if (pkgJson.scripts?.prepare === undefined) {
			// Add the prepare script
			updateJsonFile(pkgJsonPath, 'scripts.prepare', 'lionconfig');
			console.info(
				"`lionconfig` was added to your project's `prepare` script!"
			);
		}
		// There is	already a script in `prepare`, instead of overwriting it, warn the user
		else {
			console.error(
				"Warning: `lionconfig` was not added to your project's prepare script."
			);
		}
	}
}
