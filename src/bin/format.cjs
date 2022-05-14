const { runScript } = require('../utils/script.cjs');
const process = require('process');

runScript(['prettier', '--write', ...process.argv.slice(2), '.']);
