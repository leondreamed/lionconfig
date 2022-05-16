import { chProjectDir, copyPackageFiles, rmDist } from 'lion-system';
import replace from 'replace-in-file';

chProjectDir(import.meta.url);
rmDist();
await copyPackageFiles({
	additionalFiles: [
		'src/prettier/.prettierignore',
		'src/tsconfig',
		'src/tsconfig.json',
		'src/markdownlint.json',
	],
});

replace.sync({
	files: 'dist/prettier/.prettierignore',
	from: /^# temp/m,
	to: 'temp',
});
