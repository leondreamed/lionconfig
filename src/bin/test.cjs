const { runScript } = require('../utils/script.cjs');
const process = require('process');

runScript(['vitest', 'run', ...process.argv.slice(2)]);
