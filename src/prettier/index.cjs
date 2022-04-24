/**
 * @type import('prettier').Config
 */
module.exports = {
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
};
