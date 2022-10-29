/* eslint-disable no-await-in-loop */
import * as fs from 'node:fs';
import * as path from 'node:path';
import process from 'node:process';

import { getProjectDir } from 'lion-utils';
import type { RollupOptions } from 'rollup';
import type { PackageJson } from 'type-fest';

import { transformPackageJson } from '~/utils/package-json.js';

export const packageFiles = ['readme.md', 'license', 'package.json'];

interface CopyPackageFilesProps {
	additionalFiles?: string[];
	/**
		Whether or not to also create a CommonJS bundle for the project
		@default true
	*/
	commonjs?: boolean | (RollupOptions & { browser?: boolean });
	cwd?: string;
}

export async function copyPackageFiles({
	additionalFiles,
	commonjs,
	cwd = process.cwd(),
}: CopyPackageFilesProps = {}) {
	const distDir = path.join(cwd, 'dist');
	if (!fs.existsSync(distDir)) {
		fs.mkdirSync(distDir, { recursive: true });
	}

	const monorepoRoot = getProjectDir(cwd, { monorepoRoot: true });
	for (const packageFilePath of [...packageFiles, ...(additionalFiles ?? [])]) {
		let distPackageFilePath: string;
		if (
			packageFilePath.startsWith('src') ||
			packageFilePath.startsWith('./src')
		) {
			distPackageFilePath = path.join(
				distDir,
				packageFilePath.replace(/^(\.\/)?src\//, '')
			);
		} else {
			distPackageFilePath = path.join(distDir, packageFilePath);
		}

		const packageFileFullPath = path.resolve(cwd, packageFilePath);

		if (fs.existsSync(packageFileFullPath)) {
			await fs.promises.cp(packageFileFullPath, distPackageFilePath, {
				recursive: true,
			});

			if (path.parse(packageFilePath).base === 'package.json') {
				const transformedPackageJson = await transformPackageJson({
					pkg: JSON.parse(
						await fs.promises.readFile(packageFileFullPath, 'utf8')
					) as PackageJson,
					pkgPath: packageFileFullPath,
					commonjs,
				});

				await fs.promises.writeFile(
					distPackageFilePath,
					JSON.stringify(transformedPackageJson, null, '\t')
				);
			}
		}
		// If the project is a monorepo, try copying the project files from the monorepo root
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		else if (monorepoRoot !== undefined) {
			// Don't copy monorepo package.json files
			if (packageFilePath === 'package.json') {
				continue;
			}

			const monorepoFilePath = path.join(monorepoRoot, packageFilePath);

			if (fs.existsSync(monorepoFilePath)) {
				await fs.promises.cp(monorepoFilePath, distPackageFilePath, {
					recursive: true,
				});
			}
		}
	}
}
