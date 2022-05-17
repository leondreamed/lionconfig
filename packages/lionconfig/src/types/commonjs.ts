import type { Plugin, RollupOptions } from 'rollup';

export type CommonjsBundleOptions =
	| RollupOptions & { browser?: boolean; extendPlugins?: Plugin[] };
