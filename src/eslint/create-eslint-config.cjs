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
		],
		parserOptions: {
			parser: '@typescript-eslint/parser',
			ecmaVersion: 2018,
			sourceType: 'module',
			project: parserOptionsProject,
			extraFileExtensions: ['.vue', '.cjs', '.cts', '.mjs', '.mts'],
		},
		plugins: ['simple-import-sort', 'vue'],
		ignorePatterns: ['dist', 'generated', '__snapshots__'],
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
				},
			},
		],
	});

	delete projectConfig.rules;

	return deepmerge(defaultConfig, projectConfig);
}

module.exports = createESLintConfig;
