const fs = require('fs');
const path = require('path');
const process = require('process');
const { executeBin } = require('../utils/bin.cjs');

let ignorePath;
if (fs.existsSync(path.join(process.cwd(), '.prettierignore'))) {
	ignorePath = path.join(process.cwd(), '.prettierignore');
} else {
	ignorePath = path.join(__dirname, '../prettier/.prettierignore');
}

executeBin('prettier', 'bin-prettier.js', [
	'--config',
	require.resolve('../prettier.cjs'),
	`--ignore-path=${ignorePath}`,
]);
