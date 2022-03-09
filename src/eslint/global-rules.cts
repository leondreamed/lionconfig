/* eslint-disable @typescript-eslint/naming-convention */

module.exports = {
	rules: {
		'import/no-unassigned-import': 'off',
		'@typescript-eslint/consistent-type-imports': 'error',
		'unicorn/prevent-abbreviations': 'off', // code is sometimes clearer with abbreviations
		'no-else-return': 'off', // code is sometimes clearer with an else
		'no-lonely-if': 'off', // code is sometimes clearer with a lonely if
		'unicorn/prefer-ternary': 'off', // ternaries sometimes make code harder to read
		'unicorn/no-null': 'off',
		'@typescript-eslint/consistent-type-assertions': [
			'error',
			{ assertionStyle: 'as', objectLiteralTypeAssertions: 'allow' },
		],
		'import/no-extraneous-dependencies': [
			'error',
			{
				devDependencies: true,
			},
		],
		'vue/component-name-in-template-casing': ['error', 'PascalCase'],
		'tailwindcss/no-custom-classname': 'off',
		'tailwindcss/classnames-order': 'off',
		'@typescript-eslint/ban-types': [
			'error',
			{
				extendDefaults: false,
				types: {
					String: {
						message: 'Use `string` instead.',
						fixWith: 'string',
					},
					Number: {
						message: 'Use `number` instead.',
						fixWith: 'number',
					},
					Boolean: {
						message: 'Use `boolean` instead.',
						fixWith: 'boolean',
					},
					Symbol: {
						message: 'Use `symbol` instead.',
						fixWith: 'symbol',
					},
					Object: {
						message:
							'The `Object` type is mostly the same as `unknown`. You probably want `Record<string, unknown>` instead. See https://github.com/typescript-eslint/typescript-eslint/pull/848',
						fixWith: 'Record<string, unknown>',
					},
					'{}': {
						message:
							'The `{}` type is mostly the same as `unknown`. You probably want `Record<string, unknown>` instead.',
						fixWith: 'Record<string, unknown>',
					},
					object: {
						message:
							'The `object` type is hard to use. Use `Record<string, unknown>` instead. See: https://github.com/typescript-eslint/typescript-eslint/pull/848',
						fixWith: 'Record<string, unknown>',
					},
					Function: 'Use a specific function type instead, like `() => void`.',
					// I need to use `null` for many tools (e.g. GraphQL and Prisma)
					// null: {
					// 	message: 'Use `undefined` instead. See: https://github.com/sindresorhus/meta/issues/7',
					// 	fixWith: 'undefined'
					// },
					'[]': "Don't use the empty array type `[]`. It only allows empty arrays. Use `SomeType[]` instead.",
					'[[]]':
						"Don't use `[[]]`. It only allows an array with a single element which is an empty array. Use `SomeType[][]` instead.",
					'[[[]]]': "Don't use `[[[]]]`. Use `SomeType[][][]` instead.",
				},
			},
		],
		'capitalized-comments': 'off', // Want to be able to comment out code without it autofixing that
		// Too annoying when using keys that don't adhere to naming convention
		'@typescript-eslint/naming-convention': 'off'
	},
};
