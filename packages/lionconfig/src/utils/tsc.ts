import { execa } from 'execa'
import { replaceTscAliasPaths } from 'tsc-alias'

/**
	For some reason, setting `declarationDir` in `tsconfig.json` to the same value as `outDir` breaks `tsc`.

	Thus, we pass `declarationDir` manually.
*/
export async function tsc(options?: { tsConfigPath?: string }) {
	if (options?.tsConfigPath === undefined) {
		await execa('pnpm', ['exec', 'tsc'], { stdio: 'inherit' })
		await execa('pnpm', ['exec', 'tsc', '--emitDeclarationOnly', '--declarationDir', 'dist'], {
			stdio: 'inherit',
		})
		await replaceTscAliasPaths({ declarationDir: 'dist' })
	} else {
		await execa('pnpm', ['exec', 'tsc', '-p', options.tsConfigPath], { stdio: 'inherit' })
		await execa(
			'pnpm',
			[
				'exec',
				'tsc',
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
