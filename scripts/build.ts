import { chmodrSync } from 'chmodrp';
import { execaCommandSync as exec } from 'execa';
import { chProjectDir, copyPackageFiles, rmDist } from 'lion-system';

chProjectDir(import.meta.url);
rmDist();
exec('tsc');
await copyPackageFiles({
	additionalFiles: [
		'src/prettier/.prettierignore',
		'src/tsconfig',
		'src/tsconfig.json',
		'src/markdownlint.json',
	],
});

chmodrSync('dist/bin');
