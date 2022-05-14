/* eslint-disable prefer-destructuring */

/**
	A wrapper around ESLint to provide a default `.eslintrc.cjs` file if the project doesn't contain one.
*/

const fs = require('node:fs');
const path = require('node:path');
const { outdent } = require('outdent');

const eslintPath = require.resolve('eslint');
const eslintBinPath = path.resolve(eslintPath, '../../bin/eslint.js');

/**
	Returns true if the path is the project root (i.e. there is a package.json in the directory), and there is no `.eslintrc.cjs`.
*/
function shouldStubEslintrc(filePath) {
	if (path.basename(filePath) !== '.eslintrc.cjs') {
		return false;
	}

	const dir = path.dirname(filePath);

	return (
		existsSync(path.join(dir, 'package.json')) &&
		!existsSync(path.join(dir, '.eslintrc.cjs'))
	);
}

const readFileSync = fs.readFileSync;
fs.readFileSync = (...args) => {
	if (shouldStubEslintrc(args[0])) {
		return outdent`
			const createESLintConfig = require('lionconfig/eslint');

			module.exports = createESLintConfig(__dirname);
		`;
	} else {
		return readFileSync(...args);
	}
};

const statSync = fs.statSync;
const existsSync = fs.existsSync;

fs.statSync = (...args) => {
	if (shouldStubEslintrc(args[0])) {
		return {
			isFile: () => true,
		};
	}
	// Otherwise, just pass through
	else {
		return statSync(...args);
	}
};

fs.existsSync = (...args) => {
	if (shouldStubEslintrc(args[0])) {
		return true;
	} else {
		return existsSync(...args);
	}
};

require(eslintBinPath);
