/* eslint-disable node/prefer-global/process, prefer-rest-params */

// From: https://github.com/yarnpkg/berry/blob/2cf0a8fe3e4d4bd7d4d344245d24a85a45d4c5c9/packages/yarnpkg-pnp/sources/loader/applyPatch.ts#L414-L435

const originalEmit = process.emit;
process.emit = function (name, data) {
	if (
		name === `warning` &&
		typeof data === `object` &&
		data.name === `ExperimentalWarning` &&
		(data.message.includes(`--experimental-loader`) ||
			data.message.includes(`Custom ESM Loaders is an experimental feature`))
	)
		return false;

	return originalEmit.apply(process, arguments);
};
