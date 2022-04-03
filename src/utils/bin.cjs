const process = require('process');
const { spawnSync } = require("child_process");
const resolve = require('resolve');

exports.executeBin = function(packageName, relativeBinPath, args) {
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
			[...process.argv.slice(2), ...args],
			{ stdio: 'inherit' }
		).status
	);
}
