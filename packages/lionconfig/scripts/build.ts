import fs from 'node:fs'

import { chmodrSync } from 'chmodrp'
import { join } from 'desm'

import { copyPackageFiles, rmDist, tsc } from '../src/index.js'

rmDist()
await tsc({ tsConfigPath: join(import.meta.url, '../tsconfig.json') })
await copyPackageFiles({
	additionalFiles: ['src/git', 'src/markdownlint.json', 'src/bin/ts-node.sh'],
})
fs.copyFileSync('src/base.json', 'dist/tsconfig.json')

chmodrSync('dist/bin', 0o755)
