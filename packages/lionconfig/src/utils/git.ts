import { execaCommandSync } from 'execa';

export function getCurrentGitBranch() {
	return execaCommandSync('git rev-parse --abbrev-ref HEAD').stdout;
}
