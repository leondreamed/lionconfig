import { execaCommandSync } from 'execa';

export function setup() {
	execaCommandSync('pnpm build', { stdio: 'inherit' });
}
