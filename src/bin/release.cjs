const { runScript } = require('../utils/script.cjs');
const process = require('process');

runScript(['lionp', ...process.argv.slice(2)]);
