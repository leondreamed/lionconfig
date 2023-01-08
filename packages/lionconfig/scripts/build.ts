import { chmodrSync } from 'chmodrp'
import { join } from 'desm'

import { copyPackageFiles, rmDist, tsc } from '../src/index.js'

rmDist()
await tsc({ tsConfigPath: join(import.meta.url, '../tsconfig.json') })
await copyPackageFiles({
	additionalFiles: [
		'src/git',
		'src/tsconfig',
		'src/base.json',
		'src/markdownlint.json',
		'src/bin/ts-node.sh',
	],
})

chmodrSync('dist/bin', 0o755)
