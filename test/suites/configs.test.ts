import path from 'node:path';
import fs from 'node:fs';
import { execaCommand } from 'execa';
import { join } from 'desm';
import { beforeAll, afterAll, test } from 'vitest';

const myProjectPath = join(import.meta.url, '../fixtures/my-project');
const tempFolder = join(import.meta.url, '../temp');

beforeAll(() => {
	fs.rmSync(tempFolder, { force: true, recursive: true });
});

afterAll(() => {
	// fs.rmSync(tempFolder, { force: true, recursive: true });
});

async function cloneTempProject(testName: string) {
	const tempProjectDir = path.join(tempFolder, testName);
	console.log(tempProjectDir);
	await fs.promises.mkdir(tempProjectDir, { recursive: true });
	await fs.promises.cp(myProjectPath, tempProjectDir, { recursive: true });
	await execaCommand('pnpm install', { cwd: tempProjectDir });
	return tempProjectDir;
}

{
	const testName = 'eslint works';
	test.concurrent(testName, async () => {
		const tempProjectDir = await cloneTempProject(testName);
		await execaCommand('pnpm exec eslint --fix .', {
			cwd: tempProjectDir,
			stdio: 'inherit',
		});
	});
}

{
	const testName = 'prettier works';
	test.concurrent(testName, async () => {
		const tempProjectDir = await cloneTempProject(testName);
		await execaCommand('pnpm exec prettier --write src', {
			cwd: tempProjectDir,
			stdio: 'inherit',
		});
	});
}

{
	const testName = 'commitlint works';
	test.concurrent(testName, async () => {
		const tempProjectDir = await cloneTempProject(testName);
		const commitlintProcess = execaCommand('pnpm exec commitlint', {
			cwd: tempProjectDir,
			stdio: 'inherit',
		});
		commitlintProcess.stdin?.write('fix: fix');
		await commitlintProcess;
	});
}

{
	const testName = 'markdownlint works';
	test.concurrent(testName, async () => {
		const tempProjectDir = await cloneTempProject(testName);
		await execaCommand('pnpm exec markdownlint-cli readme.md', {
			cwd: tempProjectDir,
			stdio: 'inherit',
		});
	});
}

{
	const testName = 'typescript works';
	test.concurrent(testName, async () => {
		const tempProjectDir = await cloneTempProject(testName);
		await execaCommand('pnpm exec tsc --noEmit', {
			cwd: tempProjectDir,
			stdio: 'inherit',
		});
	});
}
