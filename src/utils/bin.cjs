const { spawnSync } = require("child_process");

exports.executeBin = function(binName) {
	spawnSync(require.resolve(binName), process.argv.slice(2));
}
