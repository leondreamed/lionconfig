import { execaCommandSync } from 'execa';
import lionFixture from 'lion-fixture';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, expect, test } from 'vitest';

import {
	copyPackageFiles,
	getProjectDir,
	rewritePackageJsonPaths,
	transformPackageJson,
} from '~/index.js';
import { projectTestPath } from '~test/utils/paths.js';

const { fixture } = lionFixture(import.meta.url);

test('successfully copies files', async () => {
	const myProjectTempDir = await fixture('my-project');

	await copyPackageFiles({
		cwd: myProjectTempDir,
		additionalFiles: [
			'custom-file',
			'custom-folder',
			'src/file1.html',
			'./src/file2.html',
		],
	});

	const distDir = path.join(myProjectTempDir, 'dist');

	expect(fs.existsSync(path.join(distDir, 'readme.md'))).toBe(true);
	expect(fs.existsSync(path.join(distDir, 'custom-file'))).toBe(true);
	expect(fs.existsSync(path.join(distDir, 'custom-folder'))).toBe(true);
	expect(
		fs.existsSync(path.join(distDir, 'custom-folder/custom-folder-file'))
	).toBe(true);
	expect(fs.existsSync(path.join(distDir, 'file1.html'))).toBe(true);
	expect(fs.existsSync(path.join(distDir, 'file2.html'))).toBe(true);
});

test('successfully gets the correct project directory', () => {
	const projectFixturePath = path.join(projectTestPath, 'fixtures/my-project');
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

describe.todo('commonjs bundle', () => {
	test('works with commonjs-bundle/', async () => {
		const commonjsBundleTempDir = await fixture('commonjs-bundle');

		const pkg = await transformPackageJson({
			cwd: commonjsBundleTempDir,
		});

		expect(pkg.exports).toEqual({
			import: './index.js',
			require: './index.cjs',
		});
		expect(
			fs.existsSync(path.join(commonjsBundleTempDir, 'dist/index.cjs'))
		).toBe(true);
	});

	test('works with commonjs-bundle-object-exports/', async () => {
		const commonjsBundleObjectExportsTempDir = await fixture(
			'commonjs-bundle-object-exports'
		);

		const pkg = await transformPackageJson({
			cwd: commonjsBundleObjectExportsTempDir,
		});

		expect((pkg.exports as Record<string, string>)['.']).toEqual({
			import: './index.js',
			require: './index.cjs',
		});
		expect(
			fs.existsSync(
				path.join(commonjsBundleObjectExportsTempDir, 'dist/index.cjs')
			)
		).toBe(true);
	});

	test('works with maybe-browser-bundle/', async () => {
		const browserBundleTempDir = await fixture(
			'maybe-browser-bundle',
			'browser-bundle'
		);
		await copyPackageFiles({
			cwd: browserBundleTempDir,
		});

		expect(() =>
			execaCommandSync('node dist/index.cjs', { cwd: browserBundleTempDir })
		).not.toThrow();

		const browserBundleNodeTempDir = await fixture(
			'maybe-browser-bundle',
			'browser-bundle-node'
		);
		await copyPackageFiles({
			cwd: browserBundleNodeTempDir,
			commonjs: {
				browser: true,
			},
		});

		expect(() =>
			execaCommandSync('node dist/index.cjs', { cwd: browserBundleNodeTempDir })
		).toThrow();
	});
});
