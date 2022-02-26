import { execaCommandSync as exec } from 'execa';
import fs from 'fs';
import { copyPackageFiles, rmDist, chProjectDir } from 'lion-system';

chProjectDir(import.meta.url)
rmDist();
exec('tsc');
copyPackageFiles();
fs.cpSync('src/tsconfig', 'dist/tsconfig', { recursive: true });
fs.cpSync('src/tsconfig.json', 'dist/tsconfig.json');
