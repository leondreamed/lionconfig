const { runScript } = require('../utils/script.cjs');

runScript(['eslint', '--cache', '--fix', '.']);
