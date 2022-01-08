module.exports = (aliasMap: Record<string, string>) => ({
	'import/resolver': {
		alias: {
			extensions: ['.js', '.ts'],
			map: Object.entries(aliasMap),
		},
	},
});
