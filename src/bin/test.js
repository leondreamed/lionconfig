#!/usr/bin/env node

import process from 'node:process';

import { runScript } from '../utils/script.js';

runScript(['vitest', 'run', ...process.argv.slice(2)]);
