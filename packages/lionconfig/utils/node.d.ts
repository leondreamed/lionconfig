interface NodeTSOptions {
    args?: string[];
    env?: Record<string, string>;
    resolvePkgFromFile?: boolean;
}
export declare function tsNode(filePath: string, options?: NodeTSOptions): void;
export {};
