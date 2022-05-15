import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import process from 'node:process';
import pkgUp from 'pkg-up';

export function runScript(scriptArgs) {
	const pkgJsonPath = pkgUp.sync({ cwd: process.cwd() });
	const pkgJsonDir = path.dirname(pkgJsonPath);

	if (fs.existsSync(path.join(pkgJsonDir, 'pnpm-workspace.yaml'))) {
		// The script will be run from the context of the workspace root, so run linting recursively
		process.exit(
			spawnSync('pnpm', ['recursive', 'exec', ...scriptArgs], {
				stdio: 'inherit',
			}).status
		);
	} else {
		process.exit(
			spawnSync('pnpm', ['exec', ...scriptArgs], { stdio: 'inherit' }).status
		);
	}
}
