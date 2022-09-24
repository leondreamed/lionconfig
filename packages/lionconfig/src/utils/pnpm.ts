import * as path from 'node:path';

import { findWorkspacePackagesNoCheck } from '@pnpm/find-workspace-packages';
import { findUp } from 'find-up';

export async function findWorkspaceOfPackage(
	packageDir: string
): Promise<{ path: string } | undefined> {
	const pnpmWorkspaceYamlPath = await findUp('pnpm-workspace.yaml');
	if (pnpmWorkspaceYamlPath === undefined) {
		return undefined;
	}

	const workspacePackages = await findWorkspacePackagesNoCheck(
		path.dirname(pnpmWorkspaceYamlPath)
	);
	if (workspacePackages.some((pkg) => pkg.dir === packageDir)) {
		return { path: path.dirname(pnpmWorkspaceYamlPath) };
	} else {
		return undefined;
	}
}
