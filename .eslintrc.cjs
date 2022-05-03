const createESLintConfig = require('@leonzalion/configs/eslint.cjs')

module.exports = createESLintConfig(__dirname, {
	ignorePatterns: ['test/fixtures'],
	rules: {
		'unicorn/no-process-exit': 'off',
	},
});
