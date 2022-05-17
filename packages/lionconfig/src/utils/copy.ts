import * as fs from 'node:fs';
import * as path from 'node:path';
import type { RollupOptions } from 'rollup';
import type { PackageJson } from 'type-fest';

import { transformPackageJson } from '~/utils/package-json.js';
import { getMonorepoRoot } from '~/utils/project-dir.js';

export const packageFiles = ['readme.md', 'license', 'package.json'];

interface CopyPackageFilesProps {
	additionalFiles?: string[];
	/**
		Whether or not to also create a CommonJS bundle for the project

		@default true
	*/
	commonjs?: boolean | (RollupOptions & { browser?: boolean });
}

export async function copyPackageFiles({
	additionalFiles,
	commonjs,
}: CopyPackageFilesProps = {}) {
	if (!fs.existsSync('dist')) {
		fs.mkdirSync('dist');
	}

	const monorepoRoot = getMonorepoRoot();
	for (const packageFilePath of [...packageFiles, ...(additionalFiles ?? [])]) {
		let distPackageFilePath: string;
		if (
			packageFilePath.startsWith('src') ||
			packageFilePath.startsWith('./src')
		) {
			distPackageFilePath = path.join(
				'dist',
				packageFilePath.replace(/^(\.\/)?src\//, '')
			);
		} else {
			distPackageFilePath = path.join('dist', packageFilePath);
		}

		if (fs.existsSync(packageFilePath)) {
			fs.cpSync(packageFilePath, distPackageFilePath, {
				recursive: true,
			});

			if (path.parse(packageFilePath).base === 'package.json') {
				const transformedPackageJson =
					// eslint-disable-next-line no-await-in-loop
					await transformPackageJson({
						pkg: JSON.parse(
							fs.readFileSync(packageFilePath, 'utf8')
						) as PackageJson,
						pkgPath: packageFilePath,
						commonjs,
					});

				fs.writeFileSync(
					distPackageFilePath,
					JSON.stringify(transformedPackageJson, null, '\t')
				);
			}
		}
		// If the project is a monorepo, try copying the project files from the monorepo root
		else if (monorepoRoot !== undefined) {
			// Don't copy monorepo package.json files
			if (packageFilePath === 'package.json') continue;

			const monorepoFilePath = path.join(monorepoRoot, packageFilePath);

			if (fs.existsSync(monorepoFilePath)) {
				fs.cpSync(monorepoFilePath, distPackageFilePath, { recursive: true });
			}
		}
	}

	fs.writeFileSync('dist/.gitkeep', '');
}
