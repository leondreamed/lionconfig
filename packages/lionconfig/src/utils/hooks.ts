import { execaCommandSync as exec, execaSync } from 'execa';
import process from 'node:process';

import { getCurrentGitBranch } from '~/utils/git.js';

export function preCommit() {
	if (getCurrentGitBranch() === 'dev') {
		return;
	}

	try {
		exec('pnpm exec lint-staged', { stdio: 'inherit' });
	} catch {
		process.exit(1);
	}
}

export function prePush() {
	if (getCurrentGitBranch() === 'dev') {
		return;
	}

	try {
		exec('pnpm exec typecheck', { stdio: 'inherit' });
	} catch {
		process.exit(1);
	}
}

export function commitMsg() {
	const message = process.argv.at(-1);

	if (message === undefined) {
		throw new Error('No message provided.');
	}

	try {
		execaSync('pnpm', ['exec', 'commitlint', '--edit', message], {
			stdio: 'inherit',
		});
	} catch {
		process.exit(1);
	}
}
