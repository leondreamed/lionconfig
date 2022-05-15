import findWorkspacePackages from '@pnpm/find-workspace-packages';
import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import process from 'node:process';
import pkgUp from 'pkg-up';

export async function runScript(scriptArgs, condition) {
	const pkgJsonPath = pkgUp.sync({ cwd: process.cwd() });
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
			const workspacePackages = await findWorkspacePackages(pkgJsonDir);

			// Filter the workspaces which meet a certain condition
			for (const workspacePackage of workspacePackages) {
				if (condition?.(workspacePackage.dir)) {
					workspacesToRunScript.push(workspacePackage.dir);
				}
			}

			const pnpmFilterArgs = workspacePackages.flatMap(
				workspacesToRunScript.map((workspaceDir) => ['--filter', workspaceDir])
			);

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
