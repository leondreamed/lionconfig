import { join } from 'desm';
import { execaCommandSync } from 'execa';
import lionFixture from 'lion-fixture';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as process from 'node:process';
import { beforeEach, describe, expect, test } from 'vitest';

import {
	copyPackageFiles,
	getProjectDir,
	rewritePackageJsonPaths,
	transformPackageJson,
} from '~/index.js';
import { projectTestPath } from '~test/utils/paths.js';

const { fixture } = lionFixture(import.meta.url);

beforeEach(() => {
	fs.rmSync(join(import.meta.url, '../temp'), { recursive: true, force: true });
});

describe('successfully copies files', () => {
	test('successfully copies files', async () => {
		const tempMyProjectDir = await fixture('my-project');
		process.chdir(tempMyProjectDir);

		await copyPackageFiles({
			additionalFiles: [
				'custom-file',
				'custom-folder',
				'src/file1.html',
				'./src/file2.html',
			],
		});
		expect(fs.existsSync('dist/readme.md')).toBe(true);
		expect(fs.existsSync('dist/custom-file')).toBe(true);
		expect(fs.existsSync('dist/custom-folder')).toBe(true);
		expect(fs.existsSync('dist/custom-folder/custom-folder-file')).toBe(true);
		expect(fs.existsSync('dist/file1.html')).toBe(true);
		expect(fs.existsSync('dist/file2.html')).toBe(true);

		// Adds a .gitkeep file
		expect(fs.existsSync('dist/.gitkeep')).toBe(true);
	});

	test('successfully gets the correct project directory', () => {
		const projectFixturePath = path.join(
			projectTestPath,
			'fixtures/my-project'
		);
		const subprojectFolderPath = `file://${path.join(
			projectFixturePath,
			'packages/subproject/subproject-folder'
		)}`;
		expect(getProjectDir(subprojectFolderPath)).toBe(
			path.join(projectFixturePath, 'packages/subproject')
		);
		expect(getProjectDir(subprojectFolderPath, { monorepoRoot: false })).toBe(
			path.join(projectFixturePath, 'packages/subproject')
		);
		expect(getProjectDir(subprojectFolderPath, { monorepoRoot: true })).toBe(
			projectFixturePath
		);
	});
});

test('rewriteDistPaths() works', async () => {
	const beforeObj = {
		icons: './dist/icons.png',
		main: './src/index.js',
		folder: './',
		contributes: {
			languages: [
				{
					configuration: './dist/syntaxes/jslatex-language-configuration.json',
					icon: {
						light: './icons/jslatex.png',
						dark: './icons/jslatex.png',
					},
				},
			],
			grammars: [
				{
					path: './dist/syntaxes/JSLaTeX.tmLanguage.json',
					embeddedLanguages: {
						'source.js': 'javascript',
						'meta.embedded.block.latex': 'latex',
					},
				},
			],
		},
	};

	const afterObj = {
		icons: './icons.png',
		main: './index.js',
		folder: './',
		contributes: {
			languages: [
				{
					configuration: './syntaxes/jslatex-language-configuration.json',
					icon: {
						light: './icons/jslatex.png',
						dark: './icons/jslatex.png',
					},
				},
			],
			grammars: [
				{
					path: './syntaxes/JSLaTeX.tmLanguage.json',
					embeddedLanguages: {
						'source.js': 'javascript',
						'meta.embedded.block.latex': 'latex',
					},
				},
			],
		},
	};

	expect(rewritePackageJsonPaths(beforeObj)).toEqual(afterObj);
});

describe('commonjs bundle', () => {
	test('works with commonjs-bundle/', async () => {
		const commonjsBundleTempDir = await fixture('commonjs-bundle');
		process.chdir(commonjsBundleTempDir);

		const pkg = await transformPackageJson();

		expect(pkg.exports).toEqual({
			import: './index.js',
			require: './index.cjs',
		});
		expect(fs.existsSync('./dist/index.cjs')).toBe(true);
	});

	test('works with commonjs-bundle-object-exports/', async () => {
		const commonjsBundleObjectExportsTempDir = await fixture(
			'commonjs-bundle-object-exports'
		);
		process.chdir(commonjsBundleObjectExportsTempDir);

		const pkg = await transformPackageJson();

		expect((pkg.exports as Record<string, string>)['.']).toEqual({
			import: './index.js',
			require: './index.cjs',
		});
		expect(fs.existsSync('./dist/index.cjs')).toBe(true);
	});

	test('works with maybe-browser-bundle/', async () => {
		const browserBundleTempDir = await fixture(
			'maybe-browser-bundle',
			'browser-bundle'
		);
		process.chdir(browserBundleTempDir);
		await copyPackageFiles();

		expect(() => execaCommandSync('node dist/index.cjs')).not.toThrow();

		const browserBundleNodeTempDir = await fixture(
			'maybe-browser-bundle',
			'browser-bundle-node'
		);
		process.chdir(browserBundleNodeTempDir);
		await copyPackageFiles({
			commonjs: {
				browser: true,
			},
		});

		expect(() => execaCommandSync('node dist/index.cjs')).toThrow();
	});
});
