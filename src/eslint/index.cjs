require('@rushstack/eslint-patch/modern-module-resolution.js');

const { defineConfig } = require('eslint-define-config');

module.exports = defineConfig({
	extends: [
		'xo',
		require.resolve('xo/config/plugins.cjs'),
		'plugin:vue/vue3-recommended',
		'prettier',
		require.resolve('./global-rules.cjs'),
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
				'@typescript-eslint/unified-signatures': 'off' // I prefer to add the events for defineEmits<{}> separately instead of using a unified signature
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
				require.resolve('xo/config/plugins.cjs'),
				'plugin:vue/vue3-recommended',
				'prettier',
				require.resolve('./global-rules.cjs'),
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
				'import/named': 'off',
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
