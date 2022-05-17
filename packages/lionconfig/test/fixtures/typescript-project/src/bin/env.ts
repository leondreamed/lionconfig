import process from 'node:process'

if (process.env.MY_ENV_VARIABLE === undefined) {
	throw new Error('`MY_ENV_VARIABLE` not found in environment.')
}

process.stdout.write(process.env.MY_ENV_VARIABLE);