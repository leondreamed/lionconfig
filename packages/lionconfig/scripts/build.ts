import { chmodrSync } from 'chmodrp';
import { execaCommandSync as exec } from 'execa';

import {
	chProjectDir,
	copyPackageFiles,
	rmDist,
	updateJsonFile,
} from '../src/index.js';

chProjectDir(import.meta.url);
rmDist();
exec('tsc');
exec('tsc-alias');
await copyPackageFiles({
	additionalFiles: [
		'src/prettier/.prettierignore',
		'src/git',
		'src/tsconfig',
		'src/tsconfig.json',
		'src/markdownlint.json',
	],
});

chmodrSync('dist/bin', 0o755);
updateJsonFile(
	'dist/package.json',
	'scripts.postinstall',
	'node ./postinstall.js'
);
