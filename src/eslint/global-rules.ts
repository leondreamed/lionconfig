module.exports = {
	rules: {
		'import/no-unassigned-import': 'off',
		'@typescript-eslint/consistent-type-imports': 'error',
		"node/file-extension-in-import": [
			"error",
			"always"
		],
		'unicorn/prevent-abbreviations': 'off', // code is sometimes clearer with abbreviations
		'no-else-return': 'off', // code is sometimes clearer with an else
		'no-lonely-if': 'off', // code is sometimes clearer with a lonely if
		'import/extensions': ['error', 'always'],
		'@typescript-eslint/naming-convention': [
			'error',
			{
				selector: 'default',
				format: ['camelCase'],
				leadingUnderscore: 'allowSingleOrDouble',
				trailingUnderscore: 'allow',
			},

			{
				selector: 'variable',
				format: ['camelCase', 'UPPER_CASE'],
				leadingUnderscore: 'allowSingleOrDouble',
				trailingUnderscore: 'allow',
			},

			{
				selector: 'typeLike',
				format: ['PascalCase'],
				leadingUnderscore: 'allow', // Sometimes generic type parameters are unused
			},
		],
	},
};
