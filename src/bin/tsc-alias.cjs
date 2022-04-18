#!/usr/bin/env node

const { executeBin } = require('../utils/bin.cjs');

executeBin('tsc-alias', 'dist/bin/index.js');
