module.exports = {
	rules: {
		'import/no-unassigned-import': 'off',
		'@typescript-eslint/consistent-type-imports': 'error',
		'node/file-extensions-in-import': 'off',
		'unicorn/prevent-abbreviations': 'off', // code is sometimes clearer with abbreviations
		'no-else-return': 'off', // code is sometimes clearer with an else
		'no-lonely-if': 'off', // code is sometimes clearer with a lonely if
		'import/extensions': [
			'error',
			{
				js: 'never',
				ts: 'never',
			},
		],
	},
};
