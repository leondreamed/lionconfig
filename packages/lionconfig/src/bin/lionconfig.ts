import { join } from 'desm';
import { execa } from 'execa';
import { findUpSync } from 'find-up';
import * as fs from 'node:fs';
import * as path from 'node:path';

async function setGitignoreAndGitattributes() {
	const gitRepo = findUpSync('.git', { type: 'directory' });
	if (gitRepo === undefined) {
		return;
	}

	const gitInfoDir = path.join(gitRepo, 'info');
	await fs.promises.mkdir(gitInfoDir, { recursive: true });
	const gitignore = await fs.promises.readFile(
		join(import.meta.url, '../git/_gitignore'),
		'utf8'
	);
	await fs.promises.writeFile(path.join(gitInfoDir, 'exclude'), gitignore);
	const gitattributes = await fs.promises.readFile(
		join(import.meta.url, '../git/_gitattributes'),
		'utf8'
	);
	await fs.promises.writeFile(
		path.join(gitInfoDir, 'attributes'),
		gitattributes
	);
}

async function runLionGitHooks() {
	await execa('lion-git-hooks');
}

await Promise.all([runLionGitHooks(), setGitignoreAndGitattributes()]);
