import { createRequire } from 'node:module'
import path from 'node:path'

import { execaSync } from 'execa'

const lefthookDir = path.join(
	createRequire(import.meta.url).resolve('lefthook/package.json'),
	'..'
)

execaSync(path.join(lefthookDir, 'bin/index.js'), ['install'])
