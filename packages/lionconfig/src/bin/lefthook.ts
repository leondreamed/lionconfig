#!/usr/bin/env node

import resolve from 'resolve'

const lefthookBinPath = resolve.sync('lefthook/bin/index.js')

await import(lefthookBinPath)
