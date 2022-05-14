const createESLintConfig = require('lionconfig/eslint.cjs');

module.exports = createESLintConfig(__dirname, {
	rules: {
		'object-shorthand': 'off'
	}
});