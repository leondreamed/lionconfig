import * as fs from 'node:fs';

export function rmDist() {
	if (!fs.existsSync('dist')) {
		return;
	}

	fs.rmSync('dist', { recursive: true, force: true });
}
