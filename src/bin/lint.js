#!/usr/bin/env node

import process from 'node:process';

import { runScript } from '../utils/script.js';

runScript(['eslint', '--cache', '--fix', ...process.argv.slice(2), '.']);
