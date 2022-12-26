export { copyPackageFiles, packageFiles } from './utils/copy.js'
export { commitMsg, preCommit, prePush } from './utils/hooks.js'
export {
	removePreinstallScript,
	rewritePackageJsonPaths,
	transformPackageJson,
} from './utils/package-json.js'
export { rmDist } from './utils/rm.js'
export { tsc } from './utils/tsc.js'
export { getProjectDir, updateJsonFile } from 'lion-utils'
