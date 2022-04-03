const { executeBin } = require('../utils/bin.cjs');

executeBin('@commitlint/cli', 'cli.js', [
	'--config',
	require.resolve('../commitlint.cjs')
]);