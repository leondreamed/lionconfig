const path = require('path');
const { spawnSync } = require("child_process");
const resolve = require('resolve');

exports.executeBin = function(packageName, relativeBinPath) {
	const binPath = resolve.sync(packageName, {
		basedir: __dirname,
		packageFilter(pkg) {
			pkg.main = relativeBinPath;
			return pkg;
		}
	});

	process.exit(
		spawnSync(
			binPath,
			process.argv.slice(2),
			{ stdio: 'inherit' }
		).status
	);
}
