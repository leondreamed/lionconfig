import { execaCommand } from 'execa'

export async function tsc() {
	await Promise.all([
		execaCommand('tsc'),
		execaCommand('tsc --emitDeclarationOnly --declarationDir dist'),
	])
	await execaCommand('tsc-alias')
}
