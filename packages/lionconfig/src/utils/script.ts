import { findWorkspacePackagesNoCheck } from '@pnpm/find-workspace-packages';
import { execaSync } from 'execa';
import * as fs from 'node:fs';
import * as path from 'node:path';
import process from 'node:process';
import { pkgUp } from 'pkg-up';
import type { PackageJson } from 'type-fest';

async function runScriptFromWorkspaceRoot({
	directory: workspaceDirectory,
	name: scriptName,
	condition,
}: Omit<RunScriptProps, 'defaultCommandArgs'> & { directory: string }) {
	const pkgJsonPath = path.join(workspaceDirectory, 'package.json');
	const pkgJson = JSON.parse(
		fs.readFileSync(pkgJsonPath, 'utf8')
	) as PackageJson;

	// If the workspace defines a custom script, run it
	if (pkgJson.scripts?.[scriptName] !== undefined) {
		process.exit(
			execaSync('pnpm', ['run', scriptName], {
				stdio: 'inherit',
				reject: false,
			}).exitCode
		);
	}

	// If there is no condition to check which workspace packages the script should run in,
	// then recursively run the script in all of them.
	if (condition === undefined) {
		process.exit(
			execaSync('pnpm', ['recursive', 'exec', scriptName], {
				stdio: 'inherit',
				reject: false,
			}).exitCode
		);
	}
	// Otherwise, only run the scripts where either the condition is fulfilled or if the package
	// has its own script defined.
	else {
		const workspacePackages = await findWorkspacePackagesNoCheck(
			workspaceDirectory
		);
		const workspacesToRunScript = [];

		// Filter the workspaces which meet the condition specified
		for (const workspacePackage of workspacePackages) {
			if (workspacePackage.dir === workspaceDirectory) {
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
			workspace.manifest.name!,
		]);

		// The script will be run from the context of the workspace root, so run it recursively
		process.exit(
			execaSync('pnpm', [...pnpmFilterArgs, 'recursive', 'exec', scriptName], {
				stdio: 'inherit',
				reject: false,
			}).exitCode
		);
	}
}

function runScriptFromWorkspacePackage({
	directory,
	name: scriptName,
	defaultCommandArgs,
}: Omit<RunScriptProps, 'condition'> & { directory: string }) {
	const pkgJsonPath = path.join(directory, 'package.json');
	const pkgJson = JSON.parse(
		fs.readFileSync(pkgJsonPath, 'utf8')
	) as PackageJson;

	// Run the default script if the package does not specify a custom script
	if (pkgJson.scripts?.[scriptName] === undefined) {
		process.exit(
			execaSync('pnpm', ['exec', ...defaultCommandArgs], {
				stdio: 'inherit',
				reject: false,
			}).exitCode
		);
	}
	// Run the custom script specified by the package
	else {
		process.exit(
			execaSync('pnpm', ['run', scriptName], {
				stdio: 'inherit',
				reject: false,
			}).exitCode
		);
	}
}

interface RunScriptProps {
	name: string;
	defaultCommandArgs: string[];
	condition?: (path: string) => boolean;
}

export async function runScript({
	name,
	defaultCommandArgs,
	condition,
}: RunScriptProps) {
	const pkgJsonPath = await pkgUp({ cwd: process.cwd() });
	if (pkgJsonPath === undefined) {
		throw new Error('`package.json` path could not be found.');
	}

	const pkgJsonDir = path.dirname(pkgJsonPath);

	// If the project is the workspace `package.json`
	if (fs.existsSync(path.join(pkgJsonDir, 'pnpm-workspace.yaml'))) {
		await runScriptFromWorkspaceRoot({
			directory: pkgJsonDir,
			name,
			condition,
		});
	} else {
		runScriptFromWorkspacePackage({
			directory: pkgJsonDir,
			name,
			defaultCommandArgs,
		});
	}
}
