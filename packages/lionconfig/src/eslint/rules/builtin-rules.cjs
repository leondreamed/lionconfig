/** @type {import('eslint-define-config').ESLintConfig} */
const builtinRules = {
	/**
		Commenting out code should not capitalize it.
	*/
	'capitalized-comments': 'off',

	/**
		Some third-party libraries use non-camelcase properties.
	*/
	camelcase: 'off',

	/**
		Lonely if statements are sometimes easier to understand
	*/
	'no-lonely-if': 'off',

	/**
		Adding an `else` statement after a return is easier to follow.
	*/
	'no-else-return': 'off',

	/**
		Negated conditions are sometimes easier to follow.
	*/
	'no-negated-condition': 'off',

	/**
		We use `void` to indicate that a Promise's return value is deliberately ignored.
	*/
	'no-void': 'off',

	/**
		Accessing constructors on properties like `new webpack.DefinePlugin(...)` should work.
	*/
	'new-cap': 'off',

	/**
		Loop labels makes it easier and more readable to break out of nested loops.
	*/
	'no-labels': 'off',

	/**
		Adding a function name to inline functions makes code more readable.
	*/
	'func-names': ['error', 'as-needed'],

	/**
		We sometimes need declaration functions for function overloading, but we also sometimes need arrow functions for TypeScript function types. Unfortunately, there isn't a func-style rule from `@typescript-eslint` that makes an exception for function declarations.
		@see https://github.com/typescript-eslint/typescript-eslint/issues/1236
	*/
	'func-style': 'off',

	/**
		We use @typescript-eslint/no-unused-vars instead
	*/
	'no-unused-vars': 'off',
}

module.exports = builtinRules
