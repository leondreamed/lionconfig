const process = require('process');

const { emitWarning } = process;

process.emitWarning = (warning, arg, ...rest) => {
	if (
		(arg === 'ExperimentalWarning' &&
			warning.includes('Custom ESM Loaders')) ||
		(arg === 'DeprecationWarning' && warning.includes('Obsolete loader'))
	) {
		return;
	}

	return emitWarning(warning, arg, ...rest);
};
