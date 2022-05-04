import { execa, execaCommand } from 'execa';
import lionFixture from 'lion-fixture';
import fs from 'node:fs';
import path from 'node:path';
import { beforeAll, describe, expect, test } from 'vitest';

const { fixture, tempDir, fixturesDir } = lionFixture(import.meta.url);

beforeAll(async () => {
	await fs.promises.rm(tempDir, { force: true, recursive: true });
});

describe('lints a javascript-only project properly', async () => {
	let jsProjectTempDir: string;
	beforeAll(async () => {
		jsProjectTempDir = await fixture('my-js-project');
	});

	test('eslint works', async () => {
		await execaCommand('pnpm exec eslint --fix .', {
			cwd: jsProjectTempDir,
			stdio: 'inherit',
		});
	});
});

describe('works with my-project', async () => {
	let tempFixturePath: string;
	let originalFixturePath: string;
	beforeAll(async () => {
		tempFixturePath = await fixture('my-project');
		originalFixturePath = path.join(fixturesDir, 'my-project');
	});

	test('eslint works', async () => {
		await execaCommand('pnpm exec eslint --fix .', {
			cwd: tempFixturePath,
			stdio: 'inherit',
		});
	});

	test('prettier works', async () => {
		await execaCommand('pnpm exec prettier --write .', {
			cwd: tempFixturePath,
			stdio: 'inherit',
		});

		expect(
			fs.readFileSync(
				path.join(tempFixturePath, 'generated/should-not-be-formatted.ts'),
				'utf8'
			)
		).toEqual(
			fs.readFileSync(
				path.join(tempFixturePath, 'generated/should-not-be-formatted.ts'),
				'utf8'
			)
		);

		expect(
			fs.readFileSync(
				path.join(tempFixturePath, 'not-generated/should-be-formatted.ts'),
				'utf8'
			)
		).not.toEqual(
			fs.readFileSync(
				path.join(originalFixturePath, 'not-generated/should-be-formatted.ts'),
				'utf8'
			)
		);
	});

	test('commitlint works', async () => {
		const messageTxtPath = path.join(tempFixturePath, 'message.txt');
		await fs.promises.writeFile(messageTxtPath, 'fix: fix');
		await execa('pnpm', ['exec', 'commitlint', '--edit', messageTxtPath], {
			cwd: tempFixturePath,
			stdio: 'inherit',
		});
	});

	test('markdownlint works', async () => {
		const readmePath = path.join(tempFixturePath, 'readme.md');
		await execa('pnpm', ['exec', 'markdownlint', readmePath], {
			cwd: tempFixturePath,
			stdio: 'inherit',
		});
	});

	test('typescript works', async () => {
		await execaCommand('pnpm exec tsc --noEmit', {
			cwd: tempFixturePath,
			stdio: 'inherit',
		});
	});
});

describe('supports custom .prettierignore', async () => {
	let originalFixturePath: string;
	let tempFixturePath: string;
	beforeAll(async () => {
		originalFixturePath = path.join(fixturesDir, 'custom-prettier-ignore');
		tempFixturePath = await fixture('custom-prettier-ignore');
	});

	test('prettier formatting works', async () => {
		await execaCommand('pnpm exec prettier --write .', {
			cwd: tempFixturePath,
			stdio: 'inherit',
		});

		expect(
			fs.readFileSync(
				path.join(tempFixturePath, 'generated/should-be-formatted.ts'),
				'utf8'
			)
		).not.toEqual(
			fs.readFileSync(
				path.join(originalFixturePath, 'generated/should-be-formatted.ts'),
				'utf8'
			)
		);
	});
});

describe('markdown override works', async () => {
	let originalFixturePath: string;
	let tempFixturePath: string;

	beforeAll(async () => {
		tempFixturePath = await fixture('markdown');
		originalFixturePath = path.join(fixturesDir, 'markdown');
	});

	test('does not format markdown code blocks with tabs', async () => {
		await execaCommand('pnpm exec prettier --write .', {
			cwd: tempFixturePath,
			stdio: 'inherit',
		});

		expect(
			fs.readFileSync(path.join(originalFixturePath, 'no-format.md'), 'utf8')
		).toEqual(
			fs.readFileSync(path.join(tempFixturePath, 'no-format.md'), 'utf8')
		);
	});
});
