import path from 'node:path'
import fs from 'node:fs';
import { execaCommand } from 'execa'
import { join } from 'desm';
import { nanoid } from 'nanoid'

const myProjectPath = join(import.meta.url, '../fixtures/my-project');
const tempFolder = path.join(myProjectPath, '../../temp');

beforeAll(() => {
	fs.rmSync(tempFolder, { force: true, recursive: true })
});

afterAll(() => {
	fs.rmSync(tempFolder, { force: true, recursive: true });
});

async function cloneTempProject() {
	const tempProjectDir = path.join(tempFolder, nanoid());
	await fs.promises.mkdir(tempProjectDir, { recursive: true });
	return tempProjectDir;
}

test('eslint works', async() => {
	const tempProjectDir = await cloneTempProject();
	await execaCommand('pnpm exec eslint --fix .', { cwd: tempProjectDir })
})

test('prettier works', async() => {
	const tempProjectDir = await cloneTempProject();
	await execaCommand('pnpm exec prettier --write', { cwd: tempProjectDir })
})

test('commitlint works', async() => {
	const tempProjectDir = await cloneTempProject();
	await execaCommand('pnpm exec commitlint --edit "fix: fix"', { cwd: tempProjectDir })
})

test('markdownlint works', async () => {
	const tempProjectDir = await cloneTempProject();
	await execaCommand('pnpm exec markdownlint-cli readme.md', { cwd: tempProjectDir });
})

test('typescript works', async () => {
	const tempProjectDir = await cloneTempProject();
	await execaCommand('pnpm exec tsc --noEmit', { cwd: tempProjectDir })
})

