import { findWorkspacePackagesNoCheck } from '@pnpm/find-workspace-packages';
import { execaSync } from 'execa';
import * as fs from 'node:fs';
import * as path from 'node:path';
import process from 'node:process';
import pkgUp from 'pkg-up';

export async function runScript(scriptName, scriptArgs, condition) {
	const pkgJsonPath = pkgUp.sync({ cwd: process.cwd() });
	if (pkgJsonPath === undefined) {
		throw new Error('`package.json` path could not be found.');
	}

	const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));

	// Run the script specified in the package.json if the script already exists
	if (pkgJson.scripts?.[scriptName] !== undefined) {
		process.exit(
			execaSync('pnpm', ['run', scriptName, ...scriptArgs], {
				stdio: 'inherit',
				reject: false,
			}).exitCode
		);
	}

	const pkgJsonDir = path.dirname(pkgJsonPath);

	const workspacesToRunScript = [];

	if (fs.existsSync(path.join(pkgJsonDir, 'pnpm-workspace.yaml'))) {
		if (condition === undefined) {
			process.exit(
				execaSync('pnpm', ['recursive', 'exec', ...scriptArgs], {
					stdio: 'inherit',
					reject: false,
				}).exitCode
			);
		} else {
			const workspacePackages = await findWorkspacePackagesNoCheck(pkgJsonDir);

			// Filter the workspaces which meet a certain condition
			for (const workspacePackage of workspacePackages) {
				if (workspacePackage === pkgJsonDir) {
					continue;
				}

				if (workspacePackage.manifest.scripts?.[scriptName] !== undefined) {
					workspacesToRunScript.push(workspacePackage);
				} else if (condition?.(workspacePackage.dir)) {
					workspacesToRunScript.push(workspacePackage);
				}
			}

			const pnpmFilterArgs = workspacesToRunScript.flatMap((workspace) => [
				'--filter',
				workspace.manifest.name,
			]);

			// The script will be run from the context of the workspace root, so run linting recursively
			process.exit(
				execaSync(
					'pnpm',
					[...pnpmFilterArgs, 'recursive', 'exec', ...scriptArgs],
					{
						stdio: 'inherit',
						reject: false,
					}
				).exitCode
			);
		}
	} else {
		process.exit(
			execaSync('pnpm', ['exec', ...scriptArgs], {
				stdio: 'inherit',
				reject: false,
			}).exitCode
		);
	}
}
