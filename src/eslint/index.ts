require('@rushstack/eslint-patch/modern-module-resolution');

const { defineConfig } = require('eslint-define-config');

module.exports = defineConfig({
	extends: [
		'xo',
		require.resolve('xo/config/plugins.cjs'),
		'plugin:vue/vue3-recommended',
		'prettier',
		'./global-rules.js',
	],
	parserOptions: {
		parser: '@typescript-eslint/parser',
		ecmaVersion: 2018,
		sourceType: 'module',
	},
	plugins: ['simple-import-sort', 'vue'],
	ignorePatterns: ['dist'],
	overrides: [
		{
			files: '*.vue',
			rules: {
				'import/no-default-export': 'off',
			},
		},
		{
			files: '*.cjs',
			rules: {
				'@typescript-eslint/no-require-imports': 'off',
				'@typescript-eslint/no-var-requires': 'off',
			},
		},
		{
			files: ['*.ts', '*.vue'],
			extends: [
				'xo',
				'xo-typescript',
				require.resolve('xo/config/plugins.cjs'),
				'plugin:vue/vue3-recommended',
				'prettier',
				'./global-rules.js',
			],
			parserOptions: {
				parser: '@typescript-eslint/parser',
				ecmaVersion: 2018,
				sourceType: 'module',
			},
			rules: {
				'@typescript-eslint/no-unused-vars': [
					'error',
					{
						args: 'after-used',
						argsIgnorePattern: '^_',
						varsIgnorePattern: '^_',
						caughtErrorsIgnorePattern: '^_',
					},
				],
			},
		},
		{
			files: ['scripts/**/*.ts'],
			rules: {
				'unicorn/no-process-exit': 'off',
			},
		},
	],
});
