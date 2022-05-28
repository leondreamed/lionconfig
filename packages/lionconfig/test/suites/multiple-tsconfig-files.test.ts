import { execaCommand } from 'execa';
import lionFixture from 'lion-fixture';
import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from 'vitest';

const { fixture } = lionFixture(import.meta.url);

test.todo('lionconfig works with multiple tsconfig files', async () => {
	const fixtureTempDir = await fixture('multiple-tsconfig-files', {
		ignoreWorkspace: false,
	});

	await execaCommand('pnpm exec node-ts ./src/entry.ts', {
		cwd: path.join(fixtureTempDir, 'subpackage1'),
	});

	await execaCommand('pnpm exec typecheck', {
		cwd: fixtureTempDir,
	});
	expect(fs.existsSync(path.join(fixtureTempDir, 'subpackage1/dist'))).toBe(
		false
	);

	await execaCommand('pnpm exec tsc-build', {
		cwd: fixtureTempDir,
	});
	expect(fs.existsSync(path.join(fixtureTempDir, 'subpackage1/dist'))).toBe(
		true
	);
});
