import { chmodrSync } from 'chmodrp'

import { chProjectDir, copyPackageFiles, rmDist, tsc } from '../src/index.js'

chProjectDir(import.meta.url)
rmDist()
await tsc()
await copyPackageFiles({
	additionalFiles: [
		'src/git',
		'src/tsconfig',
		'src/tsconfig.json',
		'src/markdownlint.json',
		'src/bin/ts-node.sh',
	],
})

chmodrSync('dist/bin', 0o755)
