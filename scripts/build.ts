import execa from 'execa';
import fs from 'fs-extra';
import { copyPackageFilesSync, rmDist } from 'lion-system';
import process from 'node:process';

process.chdir('..');
rmDist();
execa.sync('tsc');
copyPackageFilesSync();
fs.copySync('src/tsconfig', 'dist/tsconfig');
