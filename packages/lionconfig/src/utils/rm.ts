import * as fs from 'node:fs';
import * as path from 'node:path';

interface RmDistProps {
	removeFolder: boolean;
}
export function rmDist(props?: RmDistProps) {
	if (!fs.existsSync('dist')) {
		return;
	}

	if (props?.removeFolder) {
		fs.rmSync('dist', { recursive: true, force: true });
	} else {
		for (const file of fs.readdirSync('dist')) {
			if (file !== '.gitkeep') {
				fs.rmSync(path.join('dist', file), { force: true, recursive: true });
			}
		}
	}
}
