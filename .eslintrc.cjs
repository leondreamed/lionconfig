const createESLintConfig = require('lionconfig/eslint.cjs');

module.exports = createESLintConfig(__dirname, {
	ignorePatterns: ['test/fixtures'],
	rules: {
		'unicorn/no-process-exit': 'off',
	},
});

