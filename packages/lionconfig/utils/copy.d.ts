import type { RollupOptions } from 'rollup';
export declare const packageFiles: string[];
interface CopyPackageFilesProps {
    additionalFiles?: string[];
    /**
        Whether or not to also create a CommonJS bundle for the project
        @default true
    */
    commonjs?: boolean | (RollupOptions & {
        browser?: boolean;
    });
    cwd?: string;
}
export declare function copyPackageFiles({ additionalFiles, commonjs, cwd, }?: CopyPackageFilesProps): Promise<void>;
export {};
