const createESLintConfig = require('./src/eslint.cjs');

module.exports = createESLintConfig(__dirname, {
	ignorePatterns: ['test'],
	rules: {
		'unicorn/no-process-exit': 'off',
	},
});
