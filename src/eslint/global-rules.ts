module.exports = {
	rules: {
		'import/no-unassigned-import': 'off',
		'@typescript-eslint/consistent-type-imports': 'error',
		'node/file-extensions-in-import': 'off',
		'unicorn/prevent-abbreviations': 'off',
		'no-lonely-if': 'off',
		'import/extensions': [
			'error',
			{
				js: 'never',
				ts: 'never',
			},
		],
	},
};
