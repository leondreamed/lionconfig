import { execaCommand } from 'execa';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { tempFolderPath } from '~test/utils/paths.js';

type CloneTempProject = {
	projectPath: string;
};

export async function cloneTempProject({ projectPath }: CloneTempProject) {
	const tempProjectDir = path.join(tempFolderPath, path.basename(projectPath));
	await fs.promises.mkdir(tempProjectDir, { recursive: true });
	await fs.promises.cp(projectPath, tempProjectDir, { recursive: true });
	await execaCommand('pnpm install', { cwd: tempProjectDir });

	return tempProjectDir;
}
