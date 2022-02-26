import process from 'node:process';
import fs from 'fs'
import { join } from 'desm';
import { execa } from 'execa';

const fixturesPath = join(import.meta.url, '../fixtures');
const fixtureProjectPath = join(import.meta.url, '../fixtures/fundamental-particles-project');

describe('eslint config works', () => {
	beforeAll(async () => {
		process.chdir(fixturesPath);
		await fs.promises.mkdir('temp', { recursive: true });
		await fs.promises.cp(fixtureProjectPath, 'temp/fundamental-particles-project', { recursive: true });
		process.chdir('temp/fundamental-particles-project');
		await execa('pnpm', ['install'], {
			env: {
				WORKSPACE_DIR_ENV_VAR: process.cwd()
			}
		});
	})

	test('eslint', async () => {
		await execa('eslint', [fixtureProjectPath]);
	});
})