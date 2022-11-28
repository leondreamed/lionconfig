import { execaCommand } from 'execa'
import { replaceTscAliasPaths } from 'tsc-alias'

/**
	For some reason, setting `declarationDir` in `tsconfig.json` to the same value as `outDir` breaks `tsc`.

	Thus, we pass `declarationDir` manually.
*/
export async function tsc() {
	await execaCommand('tsc')
	await execaCommand('tsc --emitDeclarationOnly --declarationDir dist')
	await replaceTscAliasPaths({ declarationDir: 'dist' })
}
