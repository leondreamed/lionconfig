import fs from 'node:fs'
import path from 'node:path'

import { execa } from 'execa'
import { getProjectDir } from 'lion-utils'
import { replaceTscAliasPaths } from 'tsc-alias'

/**
	For some reason, setting `declarationDir` to the same value as `outDir` in `tsconfig.json` breaks `tsc`.

	Thus, we pass `declarationDir` manually.
*/
export async function tsc(options?: { tsConfigPath?: string }) {
	let tscPath = path.join(process.cwd(), 'node_modules/.bin/tsc')
	if (!fs.existsSync(tscPath)) {
		tscPath = path.join(getProjectDir(process.cwd()), 'node_modules/.bin/tsc')
	}

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
