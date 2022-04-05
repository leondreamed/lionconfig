const { executeBin } = require('../utils/bin.cjs');

executeBin('lint-staged', 'bin/lint-staged.js', [
	'--config',
	require.resolve('../lint-staged.config.cjs'),
]);
