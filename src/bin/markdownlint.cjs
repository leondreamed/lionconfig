const { executeBin } = require('../utils/bin.cjs');

executeBin('markdownlint-cli', 'markdownlint.js', [
	'--config',
	require.resolve('../commitlint.cjs')
]);