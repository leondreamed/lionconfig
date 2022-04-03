const path = require('path');
const { defineConfig } = require('eslint-define-config');

module.exports = defineConfig({
	extends: [require.resolve('./dist/eslint.cjs')],
	ignorePatterns: ['test/fixtures'],
	parserOptions: {
		project: path.resolve(__dirname, './tsconfig.eslint.json')
	},
	rules: {
		'unicorn/no-process-exit': 'off'
	}
});
