import { execaCommand } from 'execa';
import lionFixture from 'lion-fixture';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { beforeAll, describe, expect, test } from 'vitest';

const { fixture, fixturesDir } = lionFixture(import.meta.url);

let originalFixturePath: string;
let tempFixturePath: string;
beforeAll(async () => {
	originalFixturePath = path.join(fixturesDir, 'custom-prettier-ignore');
	tempFixturePath = await fixture('custom-prettier-ignore');
});

describe('supports custom .prettierignore', async () => {
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
