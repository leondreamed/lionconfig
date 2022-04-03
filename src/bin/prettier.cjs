const { executeBin } = require('../utils/bin.cjs');

executeBin('prettier', 'bin-prettier.js', [
	'--config',
	require.resolve('../prettier.cjs')
]);