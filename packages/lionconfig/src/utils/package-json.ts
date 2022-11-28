import * as fs from 'node:fs'
import * as path from 'node:path'
import process from 'node:process'

import { deepKeys, getProperty, setProperty } from 'dot-prop'
import rfdc from 'rfdc'
import type { PackageJson } from 'type-fest'

import type { CommonjsBundleOptions } from '~/types/commonjs.js'
import { createCommonjsBundles } from '~/utils/commonjs.js'

/**
	Rewrites `./dist/<path>` and `./src/<path>` paths in an object to `./<path>` paths
	@param json An object or JSON string
	@returns An object with the dist paths
*/
export function rewritePackageJsonPaths(pkg: PackageJson): PackageJson {
	for (const property of deepKeys(pkg)) {
		let value = getProperty(pkg, property) as unknown as string

		if (typeof value === 'string') {
			if (value.startsWith('./dist')) {
				value = value.replace(/^\.\/dist\//, './')
			} else if (value.startsWith('./src')) {
				value = value.replace(/^\.\/src\//, './')
			}

			if (value.endsWith('.ts') && !value.endsWith('.d.ts')) {
				value = value.replace(/\.ts$/, '.js')
			}
		}

		setProperty(pkg, property, value)
	}

	return pkg
}

export function removePreinstallScript(pkg: PackageJson) {
	if (pkg.scripts?.preinstall === 'pnpm build') {
		delete pkg.scripts.preinstall
	}

	return pkg
}

const clone = rfdc()

type TransformPackageJsonProps =
	| {
			cwd?: string
			commonjs?: boolean | CommonjsBundleOptions
	  }
	| {
			cwd?: string
			pkg: PackageJson
			pkgPath: string
			commonjs?: boolean | CommonjsBundleOptions
	  }
/**
	Transforms a `package.json` file from a source package.json to a distribution package.json to be published onto `npm`
 */
export async function transformPackageJson(
	props: TransformPackageJsonProps = {}
): Promise<PackageJson> {
	const commonjs = props.commonjs ?? true

	let pkg: PackageJson
	let pkgPath: string

	if ('pkg' in props) {
		pkg = clone(props.pkg)
		pkgPath = props.pkgPath
	} else {
		pkg = JSON.parse(
			await fs.promises.readFile('package.json', 'utf8')
		) as PackageJson
		pkgPath = path.join(props.cwd ?? process.cwd(), 'package.json')
	}

	if (commonjs !== false) {
		const rollupOptions = typeof commonjs === 'object' ? commonjs : undefined

		await createCommonjsBundles({
			pkg,
			pkgPath,
			rollupOptions,
		})
	}

	rewritePackageJsonPaths(pkg)
	removePreinstallScript(pkg)

	return pkg
}
