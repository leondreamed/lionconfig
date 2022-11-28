/** @type {import('eslint-define-config').ESLintConfig} */
const eslintPluginUnicornRules = {
	/**
		`null` is useful in many scenarios, especially when working with third-party libraries like Prisma.
	*/
	'unicorn/no-null': 'off',

	/**
		Abbreviations are useful, especially in the case of keyword collisions.
	*/
	'unicorn/prevent-abbreviations': 'off',

	/**
		Destructuring doesn't always lead to easy-to-follow code (especially nested destructuring).
	*/
	'unicorn/consistent-destructuring': 'off',

	/**
		`return undefined` is more explicit than `return`:
		- `return undefined;` implies a deliberate decision to return the value `undefined`
		- `return;` implies returning nothing of value from the function
	 */
	'unicorn/no-useless-undefined': 'off',

	/**
		`document.querySelector` can be more verbose when working with IDs or classes that are based on a variable
	*/
	'unicorn/prefer-query-selector': 'off',

	/**
		We use CommonJS in various parts of our app.
	*/
	'unicorn/prefer-module': 'off',

	/**
		`(await ...).value` is sometimes more convenient
	*/
	'unicorn/no-await-expression-member': 'off',

	/**
		Creating functions inside other functions makes for more easy-to-follow code.
	*/
	'unicorn/consistent-function-scoping': 'off',

	/**
		`process.exit(...)` is a useful feature to use in Node.js scripts.
	*/
	'unicorn/no-process-exit': 'off',

	/**
		Use tab for indenting templates.
	*/
	'unicorn/template-indent': ['error', { indent: '\t' }],

	/**
		Ternaries sometimes make code harder to read
	*/
	'unicorn/prefer-ternary': 'off',
}

module.exports = eslintPluginUnicornRules
