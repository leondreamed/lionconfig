const path = require('path');

module.exports = {
	extends: [require.resolve('./dist/eslint.cjs')],
	ignorePatterns: ['test/fixtures'],
	parserOptions: {
		project: path.resolve(__dirname, './tsconfig.eslint.json')
	}
};
