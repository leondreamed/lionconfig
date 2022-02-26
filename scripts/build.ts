import { execaCommandSync as exec } from 'execa';
import fs from 'fs';
import { copyPackageFiles, rmDist } from 'lion-system';
import process from 'node:process';

process.chdir('..');
rmDist();
exec('tsc');
copyPackageFiles();
fs.cpSync('src/tsconfig', 'dist/tsconfig', { recursive: true });
