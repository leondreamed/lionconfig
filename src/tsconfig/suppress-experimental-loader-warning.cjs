const process = require('process');

const { emitWarning } = process;

process.emitWarning = (warning, arg, ...rest) => {
	throw new Error('mkoen')
	console.log(warning, arg)
	if (
		(arg === 'ExperimentalWarning' &&
			warning.includes('--experimental-loader')) ||
		(arg === 'DeprecationWarning' && warning.includes('Obsolete loader'))
	) {
		return;
	}

	return emitWarning(warning, arg, ...rest);
};
