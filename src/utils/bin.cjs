const path = require('path');
const { spawnSync } = require("child_process");

exports.executeBin = function(packageName, relativeBinPath) {
	const packagePath = require.resolve(packageName);
	const pathPart = `/node_modules/${packageName}`;
	const packageRootPath = packagePath.slice(0, packagePath.indexOf(pathPart) + pathPart.length);
	const binPath = path.join(packageRootPath, relativeBinPath);
	spawnSync(
		binPath,
		process.argv.slice(2),
		{ stdio: 'inherit' }
	);
}
