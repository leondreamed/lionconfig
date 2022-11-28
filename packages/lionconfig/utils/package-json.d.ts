import type { PackageJson } from 'type-fest';
import type { CommonjsBundleOptions } from '~/types/commonjs.js';
/**
    Rewrites `./dist/<path>` and `./src/<path>` paths in an object to `./<path>` paths
    @param json An object or JSON string
    @returns An object with the dist paths
*/
export declare function rewritePackageJsonPaths(pkg: PackageJson): PackageJson;
export declare function removePreinstallScript(pkg: PackageJson): PackageJson;
type TransformPackageJsonProps = {
    cwd?: string;
    commonjs?: boolean | CommonjsBundleOptions;
} | {
    cwd?: string;
    pkg: PackageJson;
    pkgPath: string;
    commonjs?: boolean | CommonjsBundleOptions;
};
/**
    Transforms a `package.json` file from a source package.json to a distribution package.json to be published onto `npm`
 */
export declare function transformPackageJson(props?: TransformPackageJsonProps): Promise<PackageJson>;
export {};
