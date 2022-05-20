import { execaCommand } from 'execa';
import lionFixture from 'lion-fixture';
import { test } from 'vitest';

const { fixture } = lionFixture(import.meta.url);

test('node-ts works with multiple tsconfig files', async () => {
	const fixtureTempDir = await fixture('multiple-tsconfig-files');

	await execaCommand('pnpm exec node-ts ./subpackage1/src/entry.ts', {
		cwd: fixtureTempDir,
	});
});
