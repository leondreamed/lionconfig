import path from 'node:path';

const __dirname = new URL('.', import.meta.url).pathname;

/**
 * @type import('ts-jest/dist/types').InitialOptionsTsJest
 */
const config = {
	modulePathIgnorePatterns: ['<rootDir>/dist', '<rootDir>/src/templates'],
	setupFiles: ['./test/jest.setup.ts'],
	extensionsToTreatAsEsm: ['.ts'],
	globals: {
		'ts-jest': {
			useESM: true,
			tsconfig: path.join(__dirname, 'test/tsconfig.json'),
		},
	},
	transform: {},
	resolver: 'ts-jest-resolver',
	preset: 'ts-jest',
	testEnvironment: 'node',
	moduleNameMapper: {
		'~/(.*)\\.js$': '<rootDir>/src/$1',
		'~test/(.*)\\.js$': '<rootDir>/test/$1',
	},
};

export default config;
