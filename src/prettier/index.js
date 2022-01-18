module.exports = {
	plugins: [require.resolve('@prettier/plugin-pug')],
	useTabs: true,
	singleQuote: true,
	pugSingleFileComponentIndentation: false,
	pugSingleQuote: false,
	pugAttributeSeparator: 'always',
	pugWrapAttributesPattern: '1',
	pugEmptyAttributes: 'none',
};
