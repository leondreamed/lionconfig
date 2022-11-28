import type { PackageJson } from 'type-fest';
import type { CommonjsBundleOptions } from '~/types/commonjs.js';
interface CreateCommonjsBundlesProps {
    pkgPath: string;
    pkg: PackageJson;
    rollupOptions?: CommonjsBundleOptions;
    cwd?: string;
}
/**
    Bundles all dependencies with Rollup to produce a CommonJS bundle
*/
export declare function createCommonjsBundles({ pkgPath, pkg, rollupOptions, cwd, }: CreateCommonjsBundlesProps): Promise<void>;
export {};
