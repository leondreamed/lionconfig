const path = require('path');
const { executeBin } = require('../utils/bin.cjs');

executeBin('markdownlint-cli', 'markdownlint.js', [
	'--config',
	path.join(__dirname, '../markdownlint.json'),
]);
