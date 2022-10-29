#!/bin/sh

# This script is written in shell and not JavaScript because a Node script to spawn another Node script is an inefficient use of memory

TS_NODE_TRANSPILE_ONLY=true
node -r lionconfig/tsconfig/suppress-experimental-loader-warning.cjs --loader lionconfig/tsconfig/ts-loader.js -- $@
