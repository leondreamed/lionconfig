import process from 'node:process'

process.stdout.write(process.env.MY_ENV_VARIABLE!);