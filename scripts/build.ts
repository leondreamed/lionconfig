import fs from 'node:fs'

import { chmodr } from 'chmodrp'

import { createPackageBuilder } from '../src/index.js'

await createPackageBuilder(import.meta, {
	packageJsonPath: '../package.json',
})
	.cleanDistFolder()
	.tsc()
	.copyPackageFiles({
		additionalFiles: ['src/git', 'src/markdownlint.json', 'src/bin/ts-node.sh'],
	})
	.run(async () => {
		await fs.promises.copyFile('src/base.json', 'dist/tsconfig.json')
		await chmodr('dist/bin', 0o755)
	})
	.build()
