import { execaCommand } from 'execa';
import lionFixture from 'lion-fixture';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { beforeAll, describe, expect, test } from 'vitest';

const { fixture } = lionFixture(import.meta.url);

let tempFixturePath: string;
beforeAll(async () => {
	tempFixturePath = await fixture('custom-prettier-config');
});

describe('supports custom prettier config', async () => {
	test('prettier formatting works', async () => {
		await execaCommand('pnpm exec prettier --write .', {
			cwd: tempFixturePath,
			stdio: 'inherit',
		});

		expect(
			fs
				.readFileSync(path.join(tempFixturePath, 'index.ts'), 'utf8')
				.includes(';')
		).toBe(false);
	});
});
