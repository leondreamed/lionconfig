import * as path from 'node:path';
import * as fs from 'node:fs';
import { getBinary } from 'npm-binary';
import { join } from 'desm';

const { binaryPath, cleanup } = await getBinary(
	async ({ platform, download, tar, tmpDir }) => {
		if (platform === 'darwin') {
			const dir = await tmpDir();
			const tarFile = path.join(dir, 'git-cliff-0.6.1.tar.gz');

			await download(
				'https://github.com/orhun/git-cliff/releases/download/v0.6.1/git-cliff-0.6.1-x86_64-apple-darwin.tar.gz',
				tarFile
			);

			await tar.extract({ file: tarFile, cwd: dir });

			return path.join(dir, 'git-cliff-0.6.1/git-cliff');
		}

		throw new Error('Platform not supported');
	}
);

fs.renameSync(binaryPath, join(import.meta.url, `../src/bin/git-cliff`));

await cleanup();
