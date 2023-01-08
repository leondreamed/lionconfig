import { chmodrSync } from 'chmodrp'

import { copyPackageFiles, rmDist, tsc } from '../src/index.js'

rmDist()
await tsc()
await copyPackageFiles({
	additionalFiles: [
		'src/git',
		'src/tsconfig',
		'src/tsconfigbase.json',
		'src/markdownlint.json',
		'src/bin/ts-node.sh',
	],
})

chmodrSync('dist/bin', 0o755)
