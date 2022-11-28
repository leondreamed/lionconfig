import { execaCommand } from 'execa'
import lionFixture from 'lion-fixture'
import { beforeAll, describe, test } from 'vitest'

const { fixture } = lionFixture(import.meta.url)

let jsProjectTempDir: string
beforeAll(async () => {
	jsProjectTempDir = await fixture('javascript-only-project')
})

describe('lints a javascript-only project properly', async () => {
	test('eslint works', async () => {
		await execaCommand('pnpm exec eslint --fix .', {
			cwd: jsProjectTempDir,
			stdio: 'inherit',
		})
	})
})
