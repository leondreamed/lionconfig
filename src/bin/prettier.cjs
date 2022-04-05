const path = require('path');
const { executeBin } = require('../utils/bin.cjs');

executeBin('prettier', 'bin-prettier.js', [
	'--config',
	require.resolve('../prettier.cjs'),
	'--ignore-path',
	path.join(__dirname, '../prettier/.prettierignore'),
]);
