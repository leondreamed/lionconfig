const { emitWarning } = process;

process.emitWarning = (warning, arg, ...rest) => {
	if (arg === 'ExperimentalWarning' && warning.includes('--experimental-loader')) {
		return;
	}

	return emitWarning(warning, arg, ...rest);
}
