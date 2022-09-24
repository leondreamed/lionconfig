const path = require('path');
const findUp = require('find-up');
const pkgUp = require('@commonjs/pkg-up');

/**
	@param {string} dirname
	@returns {import('eslint-define-config').EslintConfig['rules']}
*/
function getGlobalRules(dirname) {
	const pkgJsonFile = pkgUp.sync({ cwd: dirname });
	const pnpmWorkspaceFile = findUp.sync('pnpm-workspace.yaml', {
		cwd: dirname,
	});
	const pnpmWorkspaceDir =
		pnpmWorkspaceFile === undefined
			? undefined
			: path.dirname(pnpmWorkspaceFile);

	/**
		@type {import('eslint-define-config').EslintConfig['rules']}
	*/
	const rules = {
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
		'vue/component-name-in-template-casing': ['error', 'PascalCase'],
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
		'@typescript-eslint/naming-convention': 'off',
		camelcase: 'off',

		'new-cap': 'off',
		'import/extensions': [
			'error',
			'always',
			{
				ignorePackages: true,
			},
		],
		'unicorn/prefer-json-parse-buffer': 'off',
		'unicorn/template-indent': [
			'warn',
			{
				indent: '\t',
			},
		],
		'import/order': 'off',
		'simple-import-sort/imports': 'error',
		'simple-import-sort/exports': 'error',
		'@typescript-eslint/prefer-function-type': 'off', // we use a type literal with only a call signature for defineEmits in Vue 3
		'node/file-extension-in-import': 'off', // import/extensions is better
		'vue/no-v-html': 'off', // I know when v-html is fine to use
		'@typescript-eslint/no-unused-expressions': [
			'error',
			{
				allowTaggedTemplates: true,
			},
		], // debug``
		'import/no-extraneous-dependencies': [
			'error',
			{
				packageDir:
					pnpmWorkspaceDir === undefined
						? [path.dirname(pkgJsonFile)]
						: [path.dirname(pkgJsonFile), pnpmWorkspaceDir],
			},
		],
		'yml/quotes': ['error', { prefer: 'single', avoidEscape: false }],
		'yml/no-empty-document': 'off',
		// I prefer redundant types (e.g. unknown | undefined) for self-documentation purposes
		'@typescript-eslint/no-redundant-type-constituents': 'off',
		'prettier/prettier': [
			'warn',
			{
				useTabs: true,
				singleQuote: true,
				overrides: [
					{
						files: '*.md',
						options: {
							useTabs: false,
							tabWidth: 2,
						},
					},
				],
			},
		],
	};

	return rules;
}

module.exports = getGlobalRules;
