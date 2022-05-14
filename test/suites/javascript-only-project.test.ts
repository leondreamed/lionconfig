import { execaCommand } from 'execa';
import lionFixture from 'lion-fixture';
import { beforeAll, describe, test } from 'vitest';

const { fixture } = lionFixture(import.meta.url);

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
