import { findWorkspacePackagesNoCheck } from '@pnpm/find-workspace-packages';
import { spawnSync } from 'node:child_process';
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
			spawnSync('pnpm', ['run', scriptName, ...scriptArgs], {
				stdio: 'inherit',
			}).status
		);
	}

	const pkgJsonDir = path.dirname(pkgJsonPath);

	const workspacesToRunScript = [];

	if (fs.existsSync(path.join(pkgJsonDir, 'pnpm-workspace.yaml'))) {
		if (condition === undefined) {
			process.exit(
				spawnSync('pnpm', ['recursive', 'exec', ...scriptArgs], {
					stdio: 'inherit',
				}).status
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

			const pnpmFilterArgs = workspacesToRunScript.map((workspace) => [
				'--filter',
				workspace.manifest.name,
			]);

			// The script will be run from the context of the workspace root, so run linting recursively
			process.exit(
				spawnSync('pnpm', [...pnpmFilterArgs, 'exec', ...scriptArgs], {
					stdio: 'inherit',
				}).status
			);
		}
	} else {
		process.exit(
			spawnSync('pnpm', ['exec', ...scriptArgs], { stdio: 'inherit' }).status
		);
	}
}
