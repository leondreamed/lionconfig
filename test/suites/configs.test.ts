import { execaCommand } from 'execa'
import { join } from 'desm';

const myProjectPath = join(import.meta.url, '../fixtures/my-project');
test('eslint works', async() => {

	await execaCommand('eslint --fix ', { cwd: })
})