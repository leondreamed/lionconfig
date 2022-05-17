import { expectType } from 'tsd';

import { chProjectDir, getProjectDir } from '~/index.js';

expectType<string>(getProjectDir(import.meta.url));
expectType<string>(
	getProjectDir(import.meta.url, {
		monorepoRoot: true,
	})
);
expectType<void>(
	chProjectDir(import.meta.url, {
		monorepoRoot: true,
	})
);
