const { createESLintConfig } = require('lionconfig/eslint');

module.exports = createESLintConfig(__dirname, {
	rules: {
		'object-shorthand': 'off'
	}
}, {
	includeTempFolder: true
});