import { chmodrSync } from 'chmodrp';
import { execaCommandSync as exec } from 'execa';

import { chProjectDir, copyPackageFiles, rmDist } from '../src/index.js';

chProjectDir(import.meta.url);
rmDist();
exec('tsc');
exec('tsc-alias');
await copyPackageFiles({
	additionalFiles: [
		'src/git',
		'src/tsconfig',
		'src/tsconfig.json',
		'src/markdownlint.json',
	],
});

chmodrSync('dist/bin', 0o755);
