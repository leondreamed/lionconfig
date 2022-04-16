import { dirname } from 'desm';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { cloneTempProject } from '~test/utils/clone.js';

export async function fixture(fixtureName: string) {
	// Verify that the fixture has a `package.json`
	const originalFixturePath = path.join(
		dirname(import.meta.url),
		'../fixtures',
		fixtureName
	);

	if (!fs.existsSync(path.join(originalFixturePath, 'package.json'))) {
		throw new Error('Fixture must have a `package.json` file');
	}

	const tempFixturePath = await cloneTempProject({
		projectPath: originalFixturePath,
	});

	return {
		originalFixturePath,
		tempFixturePath,
	};
}
