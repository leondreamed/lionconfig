#!/usr/bin/env node

import path from 'node:path';

import resolve from 'resolve';

const eslintPath = resolve.sync('eslint');
const eslintBinPath = path.resolve(eslintPath, '../../bin/eslint.js');

await import(eslintBinPath);
