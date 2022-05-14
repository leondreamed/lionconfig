const { runScript } = require('../utils/script.cjs');
const process = require('process');

runScript(['tsc', '--noEmit', ...process.argv.slice(2)]);
