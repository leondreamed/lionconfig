interface RunScriptProps {
    name: string;
    defaultCommandArgs: string[];
    condition?: (path: string) => boolean;
}
export declare function runScript({ name, defaultCommandArgs, condition, }: RunScriptProps): Promise<void>;
export {};
