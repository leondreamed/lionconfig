import { createRequire } from 'node:module'
import path from 'node:path'

const _lefthookDir = path.join(
	createRequire(import.meta.url).resolve('lefthook/package.json'),
	'..'
)

// TODO: debug why this makes git hooks take so long
// execaSync(path.join(lefthookDir, 'bin/index.js'), ['install'])
