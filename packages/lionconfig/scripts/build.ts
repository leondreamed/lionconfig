import { chmodrSync } from 'chmodrp'
import { execaCommandSync } from 'execa'

import { chProjectDir, copyPackageFiles, rmDist } from '../src/index.js'

chProjectDir(import.meta.url)
rmDist()
await copyPackageFiles({
	additionalFiles: [
		'src/git',
		'src/tsconfig',
		'src/tsconfig.json',
		'src/markdownlint.json',
		'src/bin/ts-node.sh',
	],
})
execaCommandSync('tsc')
execaCommandSync('tsc-alias')

chmodrSync('dist/bin', 0o755)
