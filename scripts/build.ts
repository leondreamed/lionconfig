import fs from 'node:fs';
import { execaCommandSync as exec } from 'execa';
import { copyPackageFiles, rmDist, chProjectDir } from 'lion-system';
import replace from 'replace-in-file';

chProjectDir(import.meta.url);
rmDist();
exec('tsc');
copyPackageFiles();

fs.cpSync('src/prettier/.prettierignore', 'dist/prettier/.prettierignore')
fs.cpSync('src/tsconfig', 'dist/tsconfig', { recursive: true });
fs.cpSync('src/tsconfig.json', 'dist/tsconfig.json');
fs.cpSync('src/markdownlint.json', 'dist/markdownlint.json');

replace.sync({
	files: 'dist/prettier/.prettierignore',
	from: /^# temp/m,
	to: 'temp',
});
