import { createRequire } from 'node:module'
import path from 'node:path'

import { execa } from 'execa'
import { replaceTscAliasPaths } from 'tsc-alias'

/**
	For some reason, setting `declarationDir` to the same value as `outDir` in `tsconfig.json` breaks `tsc`.

	Thus, we pass `declarationDir` manually.
*/
export async function tsc(options?: { tsConfigPath?: string }) {
	const tscPath = path.join(
		createRequire(process.cwd()).resolve('typescript/package.json'),
		'bin/tsc'
	)

	if (options?.tsConfigPath === undefined) {
		await execa(tscPath, { stdio: 'inherit' })
		await execa(
			tscPath,
			['--emitDeclarationOnly', '--declarationDir', 'dist'],
			{
				stdio: 'inherit',
			}
		)
		await replaceTscAliasPaths({ declarationDir: 'dist' })
	} else {
		await execa(tscPath, ['-p', options.tsConfigPath], { stdio: 'inherit' })
		await execa(
			tscPath,
			[
				'-p',
				options.tsConfigPath,
				'--emitDeclarationOnly',
				'--declarationDir',
				'dist',
			],
			{ stdio: 'inherit' }
		)
		await replaceTscAliasPaths({
			declarationDir: 'dist',
			configFile: options.tsConfigPath,
		})
	}
}
