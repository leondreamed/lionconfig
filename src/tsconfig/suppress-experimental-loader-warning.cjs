const { emitWarning } = process;

process.emitWarning = (warning, arg, ...rest) => {
	if (arg === 'ExperimentalWarning' && warning.includes('--experimental-loader') || arg === 'DeprecationWarning' && warning.includes('Obselete loader hooks')) {
		return;
	}

	return emitWarning(warning, arg, ...rest);
}
