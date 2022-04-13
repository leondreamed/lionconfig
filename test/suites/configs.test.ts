import { join } from 'desm';
import { execa, execaCommand } from 'execa';
import fs from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

const tempFolder = join(import.meta.url, '../temp');

type CloneTempProject = {
	projectPath: string;
};
async function cloneTempProject({ projectPath }: CloneTempProject) {
	const tempProjectDir = path.join(tempFolder, path.basename(projectPath));
	await fs.promises.mkdir(tempProjectDir, { recursive: true });
	await fs.promises.cp(projectPath, tempProjectDir, { recursive: true });
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
	const myProjectPath = join(import.meta.url, '../fixtures/my-project');
	const projectDir = await cloneTempProject({ projectPath: myProjectPath });

	test('eslint works', async () => {
		await execaCommand('pnpm exec eslint --fix .', {
			cwd: projectDir,
			stdio: 'inherit',
		});
	});

	test('prettier works', async () => {
		await execaCommand('pnpm exec prettier --write .', {
			cwd: projectDir,
			stdio: 'inherit',
		});

		expect(
			fs.readFileSync(
				path.join(
					tempFolder,
					'my-project/generated/should-not-be-formatted.ts'
				),
				'utf8'
			)
		).toEqual(
			fs.readFileSync(
				path.join(myProjectPath, 'generated/should-not-be-formatted.ts'),
				'utf8'
			)
		);

		expect(
			fs.readFileSync(
				path.join(
					tempFolder,
					'my-project/not-generated/should-be-formatted.ts'
				),
				'utf8'
			)
		).not.toEqual(
			fs.readFileSync(
				path.join(myProjectPath, 'not-generated/should-be-formatted.ts'),
				'utf8'
			)
		);
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

test('supports custom .prettierignore', async () => {
	const customPrettierIgnore = join(
		import.meta.url,
		'../fixtures/custom-prettier-ignore'
	);

	const projectDir = await cloneTempProject({
		projectPath: customPrettierIgnore,
	});

	await execaCommand('pnpm exec prettier --write .', {
		cwd: projectDir,
		stdio: 'inherit',
	});

	expect(
		fs.readFileSync(
			path.join(customPrettierIgnore, 'generated/should-be-formatted.ts'),
			'utf8'
		)
	).toEqual(
		fs.readFileSync(
			path.join(customPrettierIgnore, 'generated/should-be-formatted.ts'),
			'utf8'
		)
	);
});
