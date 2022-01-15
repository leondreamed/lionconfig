const { emitWarning } = process;

process.emitWarning = (warning, arg, ...rest) => {
	if (arg === 'ExperimentalWarning' && warning.includes('--experimental-loader') || arg === 'DeprecationWarning' && warning.includes('Obselete loader')) {
		return;
	}

	return emitWarning(warning, arg, ...rest);
}
