#!/usr/bin/env node

import process from 'node:process';

import { runScript } from '../utils/script.js';

runScript('format', ['prettier', '--write', ...process.argv.slice(2), '.']);
