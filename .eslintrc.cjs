const createESLintConfig = require('lionconfig/eslint');

module.exports = createESLintConfig(__dirname, {
	ignorePatterns: ['test'],
	rules: {
		'unicorn/no-process-exit': 'off',
	},
});
