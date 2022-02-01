const { spawnSync } = require('child_process');
const path = require('path');
const minimist = require('minimist');
const logSymbols = require('log-symbols');
const pkgUp = require('pkg-up');
const fs = require('fs');
const isCi = require('is-ci');

function getProjectDir(pathUrl) {
	const pathDirectory = path.dirname(pathUrl);
	const getPackageJson = (cwd) => {
		const packageJsonPath = pkgUp.sync({ cwd });
		if (packageJsonPath === undefined) {
			throw new Error('No project found.');
		}

		const packageJson = JSON.parse(fs.readFileSync(packageJsonPath).toString());

		return { packageJson, packageJsonPath };
	};

	let { packageJson, packageJsonPath } = getPackageJson(pathDirectory);

	// If the package.json only has "type": "module", search for another one
	while (
		packageJson.type === 'module' &&
		Object.keys(packageJson).length === 1
	) {
		const upperDirectory = path.join(path.dirname(packageJsonPath), '..');
		({ packageJson, packageJsonPath } = getPackageJson(upperDirectory));
	}

	const projectPath = path.dirname(packageJsonPath);
	return projectPath;
}

const argv = minimist(process.argv.slice(2));

if ((argv['no-ci'] && isCi()) || (argv['ci-only'] && !isCi())) {
	process.exit(0);
}

// The first CLI argument that doesn't have an option associated with it
// is the file
const filePath = argv._[0];
if (filePath === undefined) {
	throw new Error('No file specified.');
}

let fileFullPath;
// Absolute path
if (filePath.startsWith('/')) {
	fileFullPath = filePath;
}
// Relative path
else {
	fileFullPath = path.join(process.cwd(), filePath);
}

const filePathIndex = process.argv.indexOf(filePath);
const argv = [
	...process.argv.slice(2, filePathIndex),
	fileFullPath,
	...process.argv.slice(filePathIndex + 1, process.argv.length),
];

const spawnOptions = {
	stdio: 'inherit',
	// Run `node` from the working directory of the file
	cwd: getProjectDir(fileFullPath),
};

const result = spawnSync(
	'node',
	[
		'-r',
		'@leonzalion/configs/tsconfig/suppress-experimental-loader-warning.cjs',
		'--loader',
		'@leonzalion/configs/tsconfig/ts-loader.mjs',
		...argv,
	],
	spawnOptions
);

if (result.error || result.status !== 0) {
	if (result.error) {
		console.error('Error from node-ts: ', result.error);
	}

	if (result.status !== 0) {
		console.log(
			logSymbols.error,
			`node-ts: Process exited with exit code ${result.status}`
		);
		process.exit(result.status);
	}
}
