import { deepKeys, getProperty, setProperty } from 'dot-prop'
import rfdc from 'rfdc'
import type { PackageJson } from 'type-fest'

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

			// Replace exports that point to TypeScript source files with the compiled JavaScript file (but don't replace TypeScript type declarations)
			if (/\.(c|m)?ts$/.test(value) && !/\.d\.(c|m)?ts$/.test(value)) {
				value = value.replace(/ts$/, 'js')
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

interface TransformPackageJsonArgs {
	package: PackageJson
}

/**
	Transforms a `package.json` file from a source package.json to a distribution package.json to be published onto `npm`
 */
export async function transformPackageJson({
	package: originalPackage,
}: TransformPackageJsonArgs): Promise<PackageJson> {
	const newPackage = clone(originalPackage)

	rewritePackageJsonPaths(newPackage)
	removePreinstallScript(newPackage)

	return newPackage
}
