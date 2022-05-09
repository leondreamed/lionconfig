const fs = require('fs');
const path = require('path');
const getGlobalRules = require('./global-rules.cjs');
const { defineConfig } = require('eslint-define-config');
const { deepmerge } = require('deepmerge-ts');

/**
	@param {string} dirname
	@param {import('eslint-define-config').EslintConfig} config
*/
function createESLintConfig(dirname, projectConfig = {}) {
	if (dirname === undefined) {
		throw new Error('`dirname` must be provided to `createESLintConfig`');
	}

	if (typeof dirname !== 'string') {
		throw new TypeError(
			'`dirname`, the first argument passed to `createESLintConfig`, must be a string'
		);
	}

	const globalRules = getGlobalRules(dirname);

	const tsconfigEslintPath = path.resolve(dirname, 'tsconfig.eslint.json');
	const parserOptionsProject = fs.existsSync(tsconfigEslintPath)
		? tsconfigEslintPath
		: undefined;

	const defaultConfig = defineConfig({
		root: true,
		extends: [
			'xo',
			require.resolve('./plugins.cjs'),
			'plugin:vue/vue3-recommended',
			'prettier',
			'plugin:eslint-comments/recommended',
			'plugin:jsonc/recommended-with-jsonc',
			'plugin:yml/standard',
			'plugin:markdown/recommended', // Lint code inside markdown files
		],
		parserOptions: {
			parser: '@typescript-eslint/parser',
			ecmaVersion: 2018,
			sourceType: 'module',
			project: parserOptionsProject,
			extraFileExtensions: ['.vue', '.cjs', '.cts', '.mjs', '.mts'],
		},
		plugins: ['simple-import-sort', 'vue'],
		// From @antfu/eslint-config https://github.com/antfu/eslint-config/blob/f6180054022fa554e313257d724ab26664c1b1b4/packages/basic/index.js#L15
		ignorePatterns: [
			'dist',
			'generated',
			'__snapshots__',
			'temp',
			'*.min.*',
			'changelog.md',
			'license*',
			'output',
			'coverage',
			'public',
			'package-lock.json',
			'pnpm-lock.yaml',
			'yarn.lock',
			'!.github',
			'!.vitepress',
			'!.vscode',
		],
		// Rules should not be smart-merged but instead overwritten
		rules: { ...globalRules, ...projectConfig.rules },
		overrides: [
			{
				files: '*.vue',
				rules: {
					'import/no-default-export': 'off',
					'import/no-anonymous-default-export': 'off', // export default { inheritAttrs: false }
				},
			},
			{
				files: '**/.eslintrc.cjs',
				env: {
					browser: false,
					node: true,
				},
			},
			{
				files: ['*.cjs', '*.cts'],
				rules: {
					'@typescript-eslint/no-require-imports': 'off',
					'@typescript-eslint/no-var-requires': 'off',
					'unicorn/prefer-module': 'off',
				},
			},
			{
				files: ['**/vitest.config.ts', '**/.eslintrc.cjs'],
				rules: {
					'@typescript-eslint/naming-convention': 'off',
				},
			},
			{
				files: ['*.ts', '*.vue'],
				extends: [
					'xo',
					'xo-typescript',
					require.resolve('./plugins.cjs'),
					'plugin:vue/vue3-recommended',
					'prettier',
				],
				parserOptions: {
					parser: '@typescript-eslint/parser',
					ecmaVersion: 2018,
					sourceType: 'module',
				},
				rules: {
					...globalRules,
					'@typescript-eslint/no-unused-vars': [
						'error',
						{
							args: 'after-used',
							argsIgnorePattern: '^_',
							varsIgnorePattern: '^_',
							caughtErrorsIgnorePattern: '^_',
						},
					],
					'import/named': 'off',
					'@typescript-eslint/unified-signatures': 'off', // I prefer to add the events for Vue's defineEmits<{}> separately instead of using a unified signature
					...projectConfig.rules,
				},
			},
			{
				files: ['scripts/**/*.ts'],
				rules: {
					'unicorn/no-process-exit': 'off',
				},
			},
			{
				files: ['src/**/*.*'],
				rules: {
					'import/no-extraneous-dependencies': [
						'error',
						{ devDependencies: false },
					],
					...projectConfig.rules,
				},
			},
			{
				files: ['*.json', '*.json5'],
				parser: 'jsonc-eslint-parser',
				rules: {
					'jsonc/array-bracket-spacing': ['error', 'never'],
					'jsonc/comma-dangle': ['error', 'never'],
					'jsonc/comma-style': ['error', 'last'],
					'jsonc/indent': ['error', 2],
					'jsonc/key-spacing': [
						'error',
						{ beforeColon: false, afterColon: true },
					],
					'jsonc/no-octal-escape': 'error',
					'jsonc/object-curly-newline': [
						'error',
						{ multiline: true, consistent: true },
					],
					'jsonc/object-curly-spacing': ['error', 'always'],
					'jsonc/object-property-newline': [
						'error',
						{ allowMultiplePropertiesPerLine: true },
					],
				},
			},
			{
				files: ['*.yaml', '*.yml'],
				parser: 'yaml-eslint-parser',
				rules: {
					'spaced-comment': 'off',
				},
			},
			// From @antfu/eslint-plugin: https://github.com/antfu/eslint-config/blob/f6180054022fa554e313257d724ab26664c1b1b4/packages/basic/index.js#L65
			{
				files: ['package.json'],
				parser: 'jsonc-eslint-parser',
				rules: {
					'jsonc/sort-keys': [
						'error',
						{
							pathPattern: '^$',
							order: [
								'name',
								'type',
								'version',
								'private',
								'packageManager',
								'description',
								'keywords',
								'license',
								'author',
								'repository',
								'funding',
								'main',
								'module',
								'types',
								'unpkg',
								'jsdelivr',
								'exports',
								'files',
								'bin',
								'sideEffects',
								'scripts',
								'peerDependencies',
								'peerDependenciesMeta',
								'dependencies',
								'optionalDependencies',
								'devDependencies',
								'husky',
								'lint-staged',
								'eslintConfig',
							],
						},
						{
							pathPattern: '^(?:dev|peer|optional|bundled)?[Dd]ependencies$',
							order: { type: 'asc' },
						},
					],
				},
			},
			{
				// Code blocks in markdown file
				files: ['**/*.md/*.*'],
				rules: {
					'@typescript-eslint/no-redeclare': 'off',
					'@typescript-eslint/no-unused-vars': 'off',
					'@typescript-eslint/no-use-before-define': 'off',
					'@typescript-eslint/no-var-requires': 'off',
					'@typescript-eslint/comma-dangle': 'off',
					'import/no-unresolved': 'off',
					'no-alert': 'off',
					'no-console': 'off',
					'no-restricted-imports': 'off',
					'no-undef': 'off',
					'no-unused-expressions': 'off',
					'no-unused-vars': 'off',
				},
			},
		],
	});

	delete projectConfig.rules;

	return deepmerge(defaultConfig, projectConfig);
}

module.exports = createESLintConfig;
