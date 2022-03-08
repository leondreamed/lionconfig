import path from 'node:path';
import fs from 'node:fs';
import { execaCommand, execa } from 'execa';
import { join } from 'desm';
import { beforeAll, afterAll, test, describe } from 'vitest';

const myProjectPath = join(import.meta.url, '../fixtures/my-project');
const tempFolder = join(import.meta.url, '../temp');

async function cloneTempProject(projectPath: string) {
	const tempProjectDir = path.join(tempFolder, path.basename(projectPath));
	console.log(tempProjectDir);
	await fs.promises.mkdir(tempProjectDir, { recursive: true });
	await fs.promises.cp(myProjectPath, tempProjectDir, { recursive: true });
	await execaCommand('pnpm install', { cwd: tempProjectDir });
	return tempProjectDir;
}

beforeAll(async () => {
	await fs.promises.rm(tempFolder, { force: true, recursive: true });
});

afterAll(() => {
	// fs.rmSync(tempFolder, { force: true, recursive: true });
});

describe('works with my-project', async () => {
	let projectDir: string;
	beforeAll(async () => {
		projectDir = await cloneTempProject(myProjectPath);
	});

	test('eslint works', async () => {
		await execaCommand('pnpm exec eslint --fix .', {
			cwd: projectDir,
			stdio: 'inherit',
		});
	});

	test('prettier works', async () => {
		await execaCommand('pnpm exec prettier --write src', {
			cwd: projectDir,
			stdio: 'inherit',
		});
	});

	test('commitlint works', async () => {
		const messageTxtPath = path.join(projectDir, 'message.txt');
		await fs.promises.writeFile(messageTxtPath, 'fix: fix');
		await execa('pnpm', ['exec', 'commitlint', '--edit', messageTxtPath], {
			cwd: projectDir,
			stdio: 'inherit',
		});
	});

	test('markdownlint works', async () => {
		const readmePath = path.join(projectDir, 'readme.md');
		await execa('pnpm', ['exec', 'markdownlint', readmePath], {
			cwd: projectDir,
			stdio: 'inherit',
		});
	});

	test('typescript works', async () => {
		await execaCommand('pnpm exec tsc --noEmit', {
			cwd: projectDir,
			stdio: 'inherit',
		});
	});
});
