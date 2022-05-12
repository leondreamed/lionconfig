const pkgUp = require('pkg-up');
const process = require('node:process');
const path = require('node:path');
const fs = require('node:fs');
const { spawnSync } = require('node:child_process');

function runScript(scriptArgs) {
	const pkgJsonPath = pkgUp.sync({ cwd: process.cwd() });
	const pkgJsonDir = path.dirname(pkgJsonPath);

	if (fs.existsSync(path.join(pkgJsonDir, 'pnpm-workspace.yaml'))) {
		// The script will be run from the context of the workspace root, so run linting recursively
		process.exit(
			spawnSync('pnpm', ['recursive', 'exec', ...scriptArgs], {
				stdio: 'inherit',
			}).status
		);
	} else {
		process.exit(spawnSync('pnpm', ['exec', ...scriptArgs]).status);
	}
}

exports.runScript = runScript;
