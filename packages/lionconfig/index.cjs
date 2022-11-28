'use strict';

var fs$1 = require('node:fs');
var path$3 = require('node:path');
var process$2 = require('node:process');
var lionUtils = require('lion-utils');
var rfdc = require('rfdc');
var node_module = require('node:module');
var url = require('node:url');
var commonjs = require('@rollup/plugin-commonjs');
var json = require('@rollup/plugin-json');
var pluginNodeResolve = require('@rollup/plugin-node-resolve');
var typescript = require('@rollup/plugin-typescript');
var assert$1 = require('node:assert');
var v8 = require('node:v8');
var node_util = require('node:util');
var rollup = require('rollup');
var bundleESM = require('rollup-plugin-bundle-esm');
var depsExternal = require('rollup-plugin-deps-external');
var jsImports = require('rollup-plugin-js-imports');
var node_buffer = require('node:buffer');
var childProcess = require('node:child_process');
var require$$0$2 = require('child_process');
var require$$0$1 = require('path');
var require$$0 = require('fs');
var os = require('os');
require('node:os');
var require$$0$3 = require('assert');
var require$$2 = require('events');
var require$$0$5 = require('buffer');
var require$$0$4 = require('stream');
var require$$2$1 = require('util');

function _interopNamespaceDefault(e) {
	var n = Object.create(null);
	if (e) {
		Object.keys(e).forEach(function (k) {
			if (k !== 'default') {
				var d = Object.getOwnPropertyDescriptor(e, k);
				Object.defineProperty(n, k, d.get ? d : {
					enumerable: true,
					get: function () { return e[k]; }
				});
			}
		});
	}
	n.default = e;
	return Object.freeze(n);
}

var fs__namespace = /*#__PURE__*/_interopNamespaceDefault(fs$1);
var path__namespace = /*#__PURE__*/_interopNamespaceDefault(path$3);

const isObject = value => {
	const type = typeof value;
	return value !== null && (type === 'object' || type === 'function');
};

const disallowedKeys = new Set([
	'__proto__',
	'prototype',
	'constructor',
]);

const digits = new Set('0123456789');

function getPathSegments(path) {
	const parts = [];
	let currentSegment = '';
	let currentPart = 'start';
	let isIgnoring = false;

	for (const character of path) {
		switch (character) {
			case '\\':
				if (currentPart === 'index') {
					throw new Error('Invalid character in an index');
				}

				if (currentPart === 'indexEnd') {
					throw new Error('Invalid character after an index');
				}

				if (isIgnoring) {
					currentSegment += character;
				}

				currentPart = 'property';
				isIgnoring = !isIgnoring;
				break;

			case '.':
				if (currentPart === 'index') {
					throw new Error('Invalid character in an index');
				}

				if (currentPart === 'indexEnd') {
					currentPart = 'property';
					break;
				}

				if (isIgnoring) {
					isIgnoring = false;
					currentSegment += character;
					break;
				}

				if (disallowedKeys.has(currentSegment)) {
					return [];
				}

				parts.push(currentSegment);
				currentSegment = '';
				currentPart = 'property';
				break;

			case '[':
				if (currentPart === 'index') {
					throw new Error('Invalid character in an index');
				}

				if (currentPart === 'indexEnd') {
					currentPart = 'index';
					break;
				}

				if (isIgnoring) {
					isIgnoring = false;
					currentSegment += character;
					break;
				}

				if (currentPart === 'property') {
					if (disallowedKeys.has(currentSegment)) {
						return [];
					}

					parts.push(currentSegment);
					currentSegment = '';
				}

				currentPart = 'index';
				break;

			case ']':
				if (currentPart === 'index') {
					parts.push(Number.parseInt(currentSegment, 10));
					currentSegment = '';
					currentPart = 'indexEnd';
					break;
				}

				if (currentPart === 'indexEnd') {
					throw new Error('Invalid character after an index');
				}

				// Falls through

			default:
				if (currentPart === 'index' && !digits.has(character)) {
					throw new Error('Invalid character in an index');
				}

				if (currentPart === 'indexEnd') {
					throw new Error('Invalid character after an index');
				}

				if (currentPart === 'start') {
					currentPart = 'property';
				}

				if (isIgnoring) {
					isIgnoring = false;
					currentSegment += '\\';
				}

				currentSegment += character;
		}
	}

	if (isIgnoring) {
		currentSegment += '\\';
	}

	switch (currentPart) {
		case 'property': {
			if (disallowedKeys.has(currentSegment)) {
				return [];
			}

			parts.push(currentSegment);

			break;
		}

		case 'index': {
			throw new Error('Index was not closed');
		}

		case 'start': {
			parts.push('');

			break;
		}
	// No default
	}

	return parts;
}

function isStringIndex(object, key) {
	if (typeof key !== 'number' && Array.isArray(object)) {
		const index = Number.parseInt(key, 10);
		return Number.isInteger(index) && object[index] === object[key];
	}

	return false;
}

function assertNotStringIndex(object, key) {
	if (isStringIndex(object, key)) {
		throw new Error('Cannot use string index');
	}
}

function getProperty(object, path, value) {
	if (!isObject(object) || typeof path !== 'string') {
		return value === undefined ? object : value;
	}

	const pathArray = getPathSegments(path);
	if (pathArray.length === 0) {
		return value;
	}

	for (let index = 0; index < pathArray.length; index++) {
		const key = pathArray[index];

		if (isStringIndex(object, key)) {
			object = index === pathArray.length - 1 ? undefined : null;
		} else {
			object = object[key];
		}

		if (object === undefined || object === null) {
			// `object` is either `undefined` or `null` so we want to stop the loop, and
			// if this is not the last bit of the path, and
			// if it didn't return `undefined`
			// it would return `null` if `object` is `null`
			// but we want `get({foo: null}, 'foo.bar')` to equal `undefined`, or the supplied value, not `null`
			if (index !== pathArray.length - 1) {
				return value;
			}

			break;
		}
	}

	return object === undefined ? value : object;
}

function setProperty(object, path, value) {
	if (!isObject(object) || typeof path !== 'string') {
		return object;
	}

	const root = object;
	const pathArray = getPathSegments(path);

	for (let index = 0; index < pathArray.length; index++) {
		const key = pathArray[index];

		assertNotStringIndex(object, key);

		if (index === pathArray.length - 1) {
			object[key] = value;
		} else if (!isObject(object[key])) {
			object[key] = typeof pathArray[index + 1] === 'number' ? [] : {};
		}

		object = object[key];
	}

	return root;
}

function escapePath(path) {
	if (typeof path !== 'string') {
		throw new TypeError('Expected a string');
	}

	return path.replace(/[\\.[]/g, '\\$&');
}

// The keys returned by Object.entries() for arrays are strings
function entries(value) {
	if (Array.isArray(value)) {
		return value.map((value, index) => [index, value]);
	}

	return Object.entries(value);
}

function stringifyPath(pathSegments) {
	let result = '';

	for (let [index, segment] of entries(pathSegments)) {
		if (typeof segment === 'number') {
			result += `[${segment}]`;
		} else {
			segment = escapePath(segment);
			result += index === 0 ? segment : `.${segment}`;
		}
	}

	return result;
}

function * deepKeysIterator(object, currentPath = []) {
	if (!isObject(object)) {
		if (currentPath.length > 0) {
			yield stringifyPath(currentPath);
		}

		return;
	}

	for (const [key, value] of entries(object)) {
		yield * deepKeysIterator(value, [...currentPath, key]);
	}
}

function deepKeys(object) {
	return [...deepKeysIterator(object)];
}

/**
 * @typedef ErrnoExceptionFields
 * @property {number|undefined} [errnode]
 * @property {string|undefined} [code]
 * @property {string|undefined} [path]
 * @property {string|undefined} [syscall]
 * @property {string|undefined} [url]
 *
 * @typedef {Error & ErrnoExceptionFields} ErrnoException
 */

const isWindows$1 = process$2.platform === 'win32';

const own$1 = {}.hasOwnProperty;

const codes = {};

/** @type {Map<string, MessageFunction|string>} */
const messages = new Map();
const nodeInternalPrefix = '__node_internal_';
/** @type {number} */
let userStackTraceLimit;

codes.ERR_INVALID_MODULE_SPECIFIER = createError(
  'ERR_INVALID_MODULE_SPECIFIER',
  /**
   * @param {string} request
   * @param {string} reason
   * @param {string} [base]
   */
  (request, reason, base = undefined) => {
    return `Invalid module "${request}" ${reason}${
      base ? ` imported from ${base}` : ''
    }`
  },
  TypeError
);

codes.ERR_INVALID_PACKAGE_CONFIG = createError(
  'ERR_INVALID_PACKAGE_CONFIG',
  /**
   * @param {string} path
   * @param {string} [base]
   * @param {string} [message]
   */
  (path, base, message) => {
    return `Invalid package config ${path}${
      base ? ` while importing ${base}` : ''
    }${message ? `. ${message}` : ''}`
  },
  Error
);

codes.ERR_INVALID_PACKAGE_TARGET = createError(
  'ERR_INVALID_PACKAGE_TARGET',
  /**
   * @param {string} pkgPath
   * @param {string} key
   * @param {unknown} target
   * @param {boolean} [isImport=false]
   * @param {string} [base]
   */
  (pkgPath, key, target, isImport = false, base = undefined) => {
    const relError =
      typeof target === 'string' &&
      !isImport &&
      target.length > 0 &&
      !target.startsWith('./');
    if (key === '.') {
      assert$1(isImport === false);
      return (
        `Invalid "exports" main target ${JSON.stringify(target)} defined ` +
        `in the package config ${pkgPath}package.json${
          base ? ` imported from ${base}` : ''
        }${relError ? '; targets must start with "./"' : ''}`
      )
    }

    return `Invalid "${
      isImport ? 'imports' : 'exports'
    }" target ${JSON.stringify(
      target
    )} defined for '${key}' in the package config ${pkgPath}package.json${
      base ? ` imported from ${base}` : ''
    }${relError ? '; targets must start with "./"' : ''}`
  },
  Error
);

codes.ERR_MODULE_NOT_FOUND = createError(
  'ERR_MODULE_NOT_FOUND',
  /**
   * @param {string} path
   * @param {string} base
   * @param {string} [type]
   */
  (path, base, type = 'package') => {
    return `Cannot find ${type} '${path}' imported from ${base}`
  },
  Error
);

codes.ERR_NETWORK_IMPORT_DISALLOWED = createError(
  'ERR_NETWORK_IMPORT_DISALLOWED',
  "import of '%s' by %s is not supported: %s",
  Error
);

codes.ERR_PACKAGE_IMPORT_NOT_DEFINED = createError(
  'ERR_PACKAGE_IMPORT_NOT_DEFINED',
  /**
   * @param {string} specifier
   * @param {string} packagePath
   * @param {string} base
   */
  (specifier, packagePath, base) => {
    return `Package import specifier "${specifier}" is not defined${
      packagePath ? ` in package ${packagePath}package.json` : ''
    } imported from ${base}`
  },
  TypeError
);

codes.ERR_PACKAGE_PATH_NOT_EXPORTED = createError(
  'ERR_PACKAGE_PATH_NOT_EXPORTED',
  /**
   * @param {string} pkgPath
   * @param {string} subpath
   * @param {string} [base]
   */
  (pkgPath, subpath, base = undefined) => {
    if (subpath === '.')
      return `No "exports" main defined in ${pkgPath}package.json${
        base ? ` imported from ${base}` : ''
      }`
    return `Package subpath '${subpath}' is not defined by "exports" in ${pkgPath}package.json${
      base ? ` imported from ${base}` : ''
    }`
  },
  Error
);

codes.ERR_UNSUPPORTED_DIR_IMPORT = createError(
  'ERR_UNSUPPORTED_DIR_IMPORT',
  "Directory import '%s' is not supported " +
    'resolving ES modules imported from %s',
  Error
);

codes.ERR_UNKNOWN_FILE_EXTENSION = createError(
  'ERR_UNKNOWN_FILE_EXTENSION',
  /**
   * @param {string} ext
   * @param {string} path
   */
  (ext, path) => {
    return `Unknown file extension "${ext}" for ${path}`
  },
  TypeError
);

codes.ERR_INVALID_ARG_VALUE = createError(
  'ERR_INVALID_ARG_VALUE',
  /**
   * @param {string} name
   * @param {unknown} value
   * @param {string} [reason='is invalid']
   */
  (name, value, reason = 'is invalid') => {
    let inspected = node_util.inspect(value);

    if (inspected.length > 128) {
      inspected = `${inspected.slice(0, 128)}...`;
    }

    const type = name.includes('.') ? 'property' : 'argument';

    return `The ${type} '${name}' ${reason}. Received ${inspected}`
  },
  TypeError
  // Note: extra classes have been shaken out.
  // , RangeError
);

codes.ERR_UNSUPPORTED_ESM_URL_SCHEME = createError(
  'ERR_UNSUPPORTED_ESM_URL_SCHEME',
  /**
   * @param {URL} url
   * @param {Array<string>} supported
   */
  (url, supported) => {
    let message = `Only URLs with a scheme in: ${supported.join(
      ', '
    )} are supported by the default ESM loader`;
    // Let message =
    //   'Only file and data URLs are supported by the default ESM loader'

    if (isWindows$1 && url.protocol.length === 2) {
      message += '. On Windows, absolute paths must be valid file:// URLs';
    }

    message += `. Received protocol '${url.protocol}'`;
    return message
  },
  Error
);

/**
 * Utility function for registering the error codes. Only used here. Exported
 * *only* to allow for testing.
 * @param {string} sym
 * @param {MessageFunction|string} value
 * @param {ErrorConstructor} def
 * @returns {new (...args: Array<any>) => Error}
 */
function createError(sym, value, def) {
  // Special case for SystemError that formats the error message differently
  // The SystemErrors only have SystemError as their base classes.
  messages.set(sym, value);

  return makeNodeErrorWithCode(def, sym)
}

/**
 * @param {ErrorConstructor} Base
 * @param {string} key
 * @returns {ErrorConstructor}
 */
function makeNodeErrorWithCode(Base, key) {
  // @ts-expect-error It’s a Node error.
  return NodeError
  /**
   * @param {Array<unknown>} args
   */
  function NodeError(...args) {
    const limit = Error.stackTraceLimit;
    if (isErrorStackTraceLimitWritable()) Error.stackTraceLimit = 0;
    const error = new Base();
    // Reset the limit and setting the name property.
    if (isErrorStackTraceLimitWritable()) Error.stackTraceLimit = limit;
    const message = getMessage(key, args, error);
    Object.defineProperties(error, {
      // Note: no need to implement `kIsNodeError` symbol, would be hard,
      // probably.
      message: {
        value: message,
        enumerable: false,
        writable: true,
        configurable: true
      },
      toString: {
        /** @this {Error} */
        value() {
          return `${this.name} [${key}]: ${this.message}`
        },
        enumerable: false,
        writable: true,
        configurable: true
      }
    });

    captureLargerStackTrace(error);
    // @ts-expect-error It’s a Node error.
    error.code = key;
    return error
  }
}

/**
 * @returns {boolean}
 */
function isErrorStackTraceLimitWritable() {
  // Do no touch Error.stackTraceLimit as V8 would attempt to install
  // it again during deserialization.
  try {
    // @ts-expect-error: not in types?
    if (v8.startupSnapshot.isBuildingSnapshot()) {
      return false
    }
  } catch {}

  const desc = Object.getOwnPropertyDescriptor(Error, 'stackTraceLimit');
  if (desc === undefined) {
    return Object.isExtensible(Error)
  }

  return own$1.call(desc, 'writable') && desc.writable !== undefined
    ? desc.writable
    : desc.set !== undefined
}

/**
 * This function removes unnecessary frames from Node.js core errors.
 * @template {(...args: unknown[]) => unknown} T
 * @param {T} fn
 * @returns {T}
 */
function hideStackFrames(fn) {
  // We rename the functions that will be hidden to cut off the stacktrace
  // at the outermost one
  const hidden = nodeInternalPrefix + fn.name;
  Object.defineProperty(fn, 'name', {value: hidden});
  return fn
}

const captureLargerStackTrace = hideStackFrames(
  /**
   * @param {Error} error
   * @returns {Error}
   */
  // @ts-expect-error: fine
  function (error) {
    const stackTraceLimitIsWritable = isErrorStackTraceLimitWritable();
    if (stackTraceLimitIsWritable) {
      userStackTraceLimit = Error.stackTraceLimit;
      Error.stackTraceLimit = Number.POSITIVE_INFINITY;
    }

    Error.captureStackTrace(error);

    // Reset the limit
    if (stackTraceLimitIsWritable) Error.stackTraceLimit = userStackTraceLimit;

    return error
  }
);

/**
 * @param {string} key
 * @param {Array<unknown>} args
 * @param {Error} self
 * @returns {string}
 */
function getMessage(key, args, self) {
  const message = messages.get(key);
  assert$1(typeof message !== 'undefined', 'expected `message` to be found');

  if (typeof message === 'function') {
    assert$1(
      message.length <= args.length, // Default options do not count.
      `Code: ${key}; The provided arguments length (${args.length}) does not ` +
        `match the required ones (${message.length}).`
    );
    return Reflect.apply(message, self, args)
  }

  const regex = /%[dfijoOs]/g;
  let expectedLength = 0;
  while (regex.exec(message) !== null) expectedLength++;
  assert$1(
    expectedLength === args.length,
    `Code: ${key}; The provided arguments length (${args.length}) does not ` +
      `match the required ones (${expectedLength}).`
  );
  if (args.length === 0) return message

  args.unshift(message);
  return Reflect.apply(node_util.format, null, args)
}

// Manually “tree shaken” from:

const {ERR_UNKNOWN_FILE_EXTENSION} = codes;

const hasOwnProperty = {}.hasOwnProperty;

/** @type {Record<string, string>} */
const extensionFormatMap = {
  // @ts-expect-error: hush.
  __proto__: null,
  '.cjs': 'commonjs',
  '.js': 'module',
  '.json': 'json',
  '.mjs': 'module'
};

/**
 * @param {string|null} mime
 * @returns {string | null}
 */
function mimeToFormat(mime) {
  if (
    mime &&
    /\s*(text|application)\/javascript\s*(;\s*charset=utf-?8\s*)?/i.test(mime)
  )
    return 'module'
  if (mime === 'application/json') return 'json'
  return null
}

/**
 * @callback ProtocolHandler
 * @param {URL} parsed
 * @param {{parentURL: string}} context
 * @param {boolean} ignoreErrors
 * @returns {string|null|void}
 */

/**
 * @type {Record<string, ProtocolHandler>}
 */
const protocolHandlers = {
  // @ts-expect-error: hush.
  __proto__: null,
  'data:': getDataProtocolModuleFormat,
  'file:': getFileProtocolModuleFormat,
  'http:': getHttpProtocolModuleFormat,
  'https:': getHttpProtocolModuleFormat,
  'node:'() {
    return 'builtin'
  }
};

/**
 * @param {URL} parsed
 */
function getDataProtocolModuleFormat(parsed) {
  const {1: mime} = /^([^/]+\/[^;,]+)[^,]*?(;base64)?,/.exec(
    parsed.pathname
  ) || [null, null, null];
  return mimeToFormat(mime)
}

/**
 * @type {ProtocolHandler}
 */
function getFileProtocolModuleFormat(url$1, _context, ignoreErrors) {
  const filepath = url.fileURLToPath(url$1);
  const ext = path$3.extname(filepath);
  if (ext === '.js') {
    return getPackageType(url$1) === 'module' ? 'module' : 'commonjs'
  }

  const format = extensionFormatMap[ext];
  if (format) return format

  // Explicit undefined return indicates load hook should rerun format check
  if (ignoreErrors) {
    return undefined
  }

  throw new ERR_UNKNOWN_FILE_EXTENSION(ext, filepath)
}

function getHttpProtocolModuleFormat() {
  // To do: HTTPS imports.
}

/**
 * @param {URL} url
 * @param {{parentURL: string}} context
 * @returns {string|null}
 */
function defaultGetFormatWithoutErrors(url, context) {
  if (!hasOwnProperty.call(protocolHandlers, url.protocol)) {
    return null
  }

  return protocolHandlers[url.protocol](url, context, true) || null
}

// Manually “tree shaken” from:

const reader = {read};
var packageJsonReader = reader;

/**
 * @param {string} jsonPath
 * @returns {{string: string|undefined}}
 */
function read(jsonPath) {
  try {
    const string = fs$1.readFileSync(
      path$3.toNamespacedPath(path$3.join(path$3.dirname(jsonPath), 'package.json')),
      'utf8'
    );
    return {string}
  } catch (error) {
    const exception = /** @type {ErrnoException} */ (error);

    if (exception.code === 'ENOENT') {
      return {string: undefined}
      // Throw all other errors.
      /* c8 ignore next 4 */
    }

    throw exception
  }
}

// Manually “tree shaken” from:

const {ERR_INVALID_PACKAGE_CONFIG: ERR_INVALID_PACKAGE_CONFIG$1} = codes;

/** @type {Map<string, PackageConfig>} */
const packageJsonCache = new Map();

/**
 * @param {string} path
 * @param {string|URL} specifier Note: `specifier` is actually optional, not base.
 * @param {URL} [base]
 * @returns {PackageConfig}
 */
function getPackageConfig(path, specifier, base) {
  const existing = packageJsonCache.get(path);
  if (existing !== undefined) {
    return existing
  }

  const source = packageJsonReader.read(path).string;

  if (source === undefined) {
    /** @type {PackageConfig} */
    const packageConfig = {
      pjsonPath: path,
      exists: false,
      main: undefined,
      name: undefined,
      type: 'none',
      exports: undefined,
      imports: undefined
    };
    packageJsonCache.set(path, packageConfig);
    return packageConfig
  }

  /** @type {Record<string, unknown>} */
  let packageJson;
  try {
    packageJson = JSON.parse(source);
  } catch (error) {
    const exception = /** @type {ErrnoException} */ (error);

    throw new ERR_INVALID_PACKAGE_CONFIG$1(
      path,
      (base ? `"${specifier}" from ` : '') + url.fileURLToPath(base || specifier),
      exception.message
    )
  }

  const {exports, imports, main, name, type} = packageJson;

  /** @type {PackageConfig} */
  const packageConfig = {
    pjsonPath: path,
    exists: true,
    main: typeof main === 'string' ? main : undefined,
    name: typeof name === 'string' ? name : undefined,
    type: type === 'module' || type === 'commonjs' ? type : 'none',
    // @ts-expect-error Assume `Record<string, unknown>`.
    exports,
    // @ts-expect-error Assume `Record<string, unknown>`.
    imports: imports && typeof imports === 'object' ? imports : undefined
  };
  packageJsonCache.set(path, packageConfig);
  return packageConfig
}

/**
 * @param {URL} resolved
 * @returns {PackageConfig}
 */
function getPackageScopeConfig(resolved) {
  let packageJsonUrl = new url.URL('package.json', resolved);

  while (true) {
    const packageJsonPath = packageJsonUrl.pathname;

    if (packageJsonPath.endsWith('node_modules/package.json')) break

    const packageConfig = getPackageConfig(
      url.fileURLToPath(packageJsonUrl),
      resolved
    );
    if (packageConfig.exists) return packageConfig

    const lastPackageJsonUrl = packageJsonUrl;
    packageJsonUrl = new url.URL('../package.json', packageJsonUrl);

    // Terminates at root where ../package.json equals ../../package.json
    // (can't just check "/package.json" for Windows support).
    if (packageJsonUrl.pathname === lastPackageJsonUrl.pathname) break
  }

  const packageJsonPath = url.fileURLToPath(packageJsonUrl);
  /** @type {PackageConfig} */
  const packageConfig = {
    pjsonPath: packageJsonPath,
    exists: false,
    main: undefined,
    name: undefined,
    type: 'none',
    exports: undefined,
    imports: undefined
  };
  packageJsonCache.set(packageJsonPath, packageConfig);
  return packageConfig
}

// Manually “tree shaken” from:

const RegExpPrototypeSymbolReplace = RegExp.prototype[Symbol.replace];

// To do: potentially enable?
const experimentalNetworkImports = false;

const {
  ERR_NETWORK_IMPORT_DISALLOWED,
  ERR_INVALID_MODULE_SPECIFIER,
  ERR_INVALID_PACKAGE_CONFIG,
  ERR_INVALID_PACKAGE_TARGET,
  ERR_MODULE_NOT_FOUND,
  ERR_PACKAGE_IMPORT_NOT_DEFINED,
  ERR_PACKAGE_PATH_NOT_EXPORTED,
  ERR_UNSUPPORTED_DIR_IMPORT,
  ERR_UNSUPPORTED_ESM_URL_SCHEME,
  ERR_INVALID_ARG_VALUE
} = codes;

const own = {}.hasOwnProperty;

const DEFAULT_CONDITIONS = Object.freeze(['node', 'import']);
const DEFAULT_CONDITIONS_SET = new Set(DEFAULT_CONDITIONS);

const invalidSegmentRegEx =
  /(^|\\|\/)((\.|%2e)(\.|%2e)?|(n|%6e|%4e)(o|%6f|%4f)(d|%64|%44)(e|%65|%45)(_|%5f)(m|%6d|%4d)(o|%6f|%4f)(d|%64|%44)(u|%75|%55)(l|%6c|%4c)(e|%65|%45)(s|%73|%53))?(\\|\/|$)/i;
const deprecatedInvalidSegmentRegEx =
  /(^|\\|\/)((\.|%2e)(\.|%2e)?|(n|%6e|%4e)(o|%6f|%4f)(d|%64|%44)(e|%65|%45)(_|%5f)(m|%6d|%4d)(o|%6f|%4f)(d|%64|%44)(u|%75|%55)(l|%6c|%4c)(e|%65|%45)(s|%73|%53))(\\|\/|$)/i;
const invalidPackageNameRegEx = /^\.|%|\\/;
const patternRegEx = /\*/g;
const encodedSepRegEx = /%2f|%5c/i;
/** @type {Set<string>} */
const emittedPackageWarnings = new Set();

const doubleSlashRegEx = /[/\\]{2}/;

/**
 *
 * @param {string} target
 * @param {string} request
 * @param {string} match
 * @param {URL} packageJsonUrl
 * @param {boolean} internal
 * @param {URL} base
 * @param {boolean} isTarget
 */
function emitInvalidSegmentDeprecation(
  target,
  request,
  match,
  packageJsonUrl,
  internal,
  base,
  isTarget
) {
  const pjsonPath = url.fileURLToPath(packageJsonUrl);
  const double = doubleSlashRegEx.exec(isTarget ? target : request) !== null;
  process$2.emitWarning(
    `Use of deprecated ${
      double ? 'double slash' : 'leading or trailing slash matching'
    } resolving "${target}" for module ` +
      `request "${request}" ${
        request === match ? '' : `matched to "${match}" `
      }in the "${
        internal ? 'imports' : 'exports'
      }" field module resolution of the package at ${pjsonPath}${
        base ? ` imported from ${url.fileURLToPath(base)}` : ''
      }.`,
    'DeprecationWarning',
    'DEP0166'
  );
}

/**
 * @param {URL} url
 * @param {URL} packageJsonUrl
 * @param {URL} base
 * @param {unknown} [main]
 * @returns {void}
 */
function emitLegacyIndexDeprecation(url$1, packageJsonUrl, base, main) {
  const format = defaultGetFormatWithoutErrors(url$1, {parentURL: base.href});
  if (format !== 'module') return
  const path = url.fileURLToPath(url$1.href);
  const pkgPath = url.fileURLToPath(new url.URL('.', packageJsonUrl));
  const basePath = url.fileURLToPath(base);
  if (main)
    process$2.emitWarning(
      `Package ${pkgPath} has a "main" field set to ${JSON.stringify(main)}, ` +
        `excluding the full filename and extension to the resolved file at "${path.slice(
          pkgPath.length
        )}", imported from ${basePath}.\n Automatic extension resolution of the "main" field is` +
        'deprecated for ES modules.',
      'DeprecationWarning',
      'DEP0151'
    );
  else
    process$2.emitWarning(
      `No "main" or "exports" field defined in the package.json for ${pkgPath} resolving the main entry point "${path.slice(
        pkgPath.length
      )}", imported from ${basePath}.\nDefault "index" lookups for the main are deprecated for ES modules.`,
      'DeprecationWarning',
      'DEP0151'
    );
}

/**
 * @param {Array<string>} [conditions]
 * @returns {Set<string>}
 */
function getConditionsSet(conditions) {
  if (conditions !== undefined && conditions !== DEFAULT_CONDITIONS) {
    if (!Array.isArray(conditions)) {
      throw new ERR_INVALID_ARG_VALUE(
        'conditions',
        conditions,
        'expected an array'
      )
    }

    return new Set(conditions)
  }

  return DEFAULT_CONDITIONS_SET
}

/**
 * @param {string} path
 * @returns {Stats}
 */
function tryStatSync(path) {
  // Note: from Node 15 onwards we can use `throwIfNoEntry: false` instead.
  try {
    return fs$1.statSync(path)
  } catch {
    return new fs$1.Stats()
  }
}

/**
 * Legacy CommonJS main resolution:
 * 1. let M = pkg_url + (json main field)
 * 2. TRY(M, M.js, M.json, M.node)
 * 3. TRY(M/index.js, M/index.json, M/index.node)
 * 4. TRY(pkg_url/index.js, pkg_url/index.json, pkg_url/index.node)
 * 5. NOT_FOUND
 *
 * @param {URL} url
 * @returns {boolean}
 */
function fileExists(url) {
  const stats = fs$1.statSync(url, {throwIfNoEntry: false});
  const isFile = stats ? stats.isFile() : undefined;
  return isFile === null || isFile === undefined ? false : isFile
}

/**
 * @param {URL} packageJsonUrl
 * @param {PackageConfig} packageConfig
 * @param {URL} base
 * @returns {URL}
 */
function legacyMainResolve(packageJsonUrl, packageConfig, base) {
  /** @type {URL|undefined} */
  let guess;
  if (packageConfig.main !== undefined) {
    guess = new url.URL(packageConfig.main, packageJsonUrl);
    // Note: fs check redundances will be handled by Descriptor cache here.
    if (fileExists(guess)) return guess

    const tries = [
      `./${packageConfig.main}.js`,
      `./${packageConfig.main}.json`,
      `./${packageConfig.main}.node`,
      `./${packageConfig.main}/index.js`,
      `./${packageConfig.main}/index.json`,
      `./${packageConfig.main}/index.node`
    ];
    let i = -1;

    while (++i < tries.length) {
      guess = new url.URL(tries[i], packageJsonUrl);
      if (fileExists(guess)) break
      guess = undefined;
    }

    if (guess) {
      emitLegacyIndexDeprecation(
        guess,
        packageJsonUrl,
        base,
        packageConfig.main
      );
      return guess
    }
    // Fallthrough.
  }

  const tries = ['./index.js', './index.json', './index.node'];
  let i = -1;

  while (++i < tries.length) {
    guess = new url.URL(tries[i], packageJsonUrl);
    if (fileExists(guess)) break
    guess = undefined;
  }

  if (guess) {
    emitLegacyIndexDeprecation(guess, packageJsonUrl, base, packageConfig.main);
    return guess
  }

  // Not found.
  throw new ERR_MODULE_NOT_FOUND(
    url.fileURLToPath(new url.URL('.', packageJsonUrl)),
    url.fileURLToPath(base)
  )
}

/**
 * @param {URL} resolved
 * @param {URL} base
 * @param {boolean} [preserveSymlinks]
 * @returns {URL}
 */
function finalizeResolution(resolved, base, preserveSymlinks) {
  if (encodedSepRegEx.exec(resolved.pathname) !== null)
    throw new ERR_INVALID_MODULE_SPECIFIER(
      resolved.pathname,
      'must not include encoded "/" or "\\" characters',
      url.fileURLToPath(base)
    )

  const filePath = url.fileURLToPath(resolved);

  const stats = tryStatSync(
    filePath.endsWith('/') ? filePath.slice(-1) : filePath
  );

  if (stats.isDirectory()) {
    const error = new ERR_UNSUPPORTED_DIR_IMPORT(filePath, url.fileURLToPath(base));
    // @ts-expect-error Add this for `import.meta.resolve`.
    error.url = String(resolved);
    throw error
  }

  if (!stats.isFile()) {
    throw new ERR_MODULE_NOT_FOUND(
      filePath || resolved.pathname,
      base && url.fileURLToPath(base),
      'module'
    )
  }

  if (!preserveSymlinks) {
    const real = fs$1.realpathSync(filePath);
    const {search, hash} = resolved;
    resolved = url.pathToFileURL(real + (filePath.endsWith(path$3.sep) ? '/' : ''));
    resolved.search = search;
    resolved.hash = hash;
  }

  return resolved
}

/**
 * @param {string} specifier
 * @param {URL|undefined} packageJsonUrl
 * @param {URL} base
 * @returns {Error}
 */
function importNotDefined(specifier, packageJsonUrl, base) {
  return new ERR_PACKAGE_IMPORT_NOT_DEFINED(
    specifier,
    packageJsonUrl && url.fileURLToPath(new url.URL('.', packageJsonUrl)),
    url.fileURLToPath(base)
  )
}

/**
 * @param {string} subpath
 * @param {URL} packageJsonUrl
 * @param {URL} base
 * @returns {Error}
 */
function exportsNotFound(subpath, packageJsonUrl, base) {
  return new ERR_PACKAGE_PATH_NOT_EXPORTED(
    url.fileURLToPath(new url.URL('.', packageJsonUrl)),
    subpath,
    base && url.fileURLToPath(base)
  )
}

/**
 * @param {string} request
 * @param {string} match
 * @param {URL} packageJsonUrl
 * @param {boolean} internal
 * @param {URL} [base]
 * @returns {never}
 */
function throwInvalidSubpath(request, match, packageJsonUrl, internal, base) {
  const reason = `request is not a valid match in pattern "${match}" for the "${
    internal ? 'imports' : 'exports'
  }" resolution of ${url.fileURLToPath(packageJsonUrl)}`;
  throw new ERR_INVALID_MODULE_SPECIFIER(
    request,
    reason,
    base && url.fileURLToPath(base)
  )
}

/**
 * @param {string} subpath
 * @param {unknown} target
 * @param {URL} packageJsonUrl
 * @param {boolean} internal
 * @param {URL} [base]
 * @returns {Error}
 */
function invalidPackageTarget(subpath, target, packageJsonUrl, internal, base) {
  target =
    typeof target === 'object' && target !== null
      ? JSON.stringify(target, null, '')
      : `${target}`;

  return new ERR_INVALID_PACKAGE_TARGET(
    url.fileURLToPath(new url.URL('.', packageJsonUrl)),
    subpath,
    target,
    internal,
    base && url.fileURLToPath(base)
  )
}

/**
 * @param {string} target
 * @param {string} subpath
 * @param {string} match
 * @param {URL} packageJsonUrl
 * @param {URL} base
 * @param {boolean} pattern
 * @param {boolean} internal
 * @param {boolean} isPathMap
 * @param {Set<string>|undefined} conditions
 * @returns {URL}
 */
function resolvePackageTargetString(
  target,
  subpath,
  match,
  packageJsonUrl,
  base,
  pattern,
  internal,
  isPathMap,
  conditions
) {
  if (subpath !== '' && !pattern && target[target.length - 1] !== '/')
    throw invalidPackageTarget(match, target, packageJsonUrl, internal, base)

  if (!target.startsWith('./')) {
    if (internal && !target.startsWith('../') && !target.startsWith('/')) {
      let isURL = false;

      try {
        new url.URL(target);
        isURL = true;
      } catch {
        // Continue regardless of error.
      }

      if (!isURL) {
        const exportTarget = pattern
          ? RegExpPrototypeSymbolReplace.call(
              patternRegEx,
              target,
              () => subpath
            )
          : target + subpath;

        return packageResolve(exportTarget, packageJsonUrl, conditions)
      }
    }

    throw invalidPackageTarget(match, target, packageJsonUrl, internal, base)
  }

  if (invalidSegmentRegEx.exec(target.slice(2)) !== null) {
    if (deprecatedInvalidSegmentRegEx.exec(target.slice(2)) === null) {
      if (!isPathMap) {
        const request = pattern
          ? match.replace('*', () => subpath)
          : match + subpath;
        const resolvedTarget = pattern
          ? RegExpPrototypeSymbolReplace.call(
              patternRegEx,
              target,
              () => subpath
            )
          : target;
        emitInvalidSegmentDeprecation(
          resolvedTarget,
          request,
          match,
          packageJsonUrl,
          internal,
          base,
          true
        );
      }
    } else {
      throw invalidPackageTarget(match, target, packageJsonUrl, internal, base)
    }
  }

  const resolved = new url.URL(target, packageJsonUrl);
  const resolvedPath = resolved.pathname;
  const packagePath = new url.URL('.', packageJsonUrl).pathname;

  if (!resolvedPath.startsWith(packagePath))
    throw invalidPackageTarget(match, target, packageJsonUrl, internal, base)

  if (subpath === '') return resolved

  if (invalidSegmentRegEx.exec(subpath) !== null) {
    const request = pattern
      ? match.replace('*', () => subpath)
      : match + subpath;
    if (deprecatedInvalidSegmentRegEx.exec(subpath) === null) {
      if (!isPathMap) {
        const resolvedTarget = pattern
          ? RegExpPrototypeSymbolReplace.call(
              patternRegEx,
              target,
              () => subpath
            )
          : target;
        emitInvalidSegmentDeprecation(
          resolvedTarget,
          request,
          match,
          packageJsonUrl,
          internal,
          base,
          false
        );
      }
    } else {
      throwInvalidSubpath(request, match, packageJsonUrl, internal, base);
    }
  }

  if (pattern) {
    return new url.URL(
      RegExpPrototypeSymbolReplace.call(
        patternRegEx,
        resolved.href,
        () => subpath
      )
    )
  }

  return new url.URL(subpath, resolved)
}

/**
 * @param {string} key
 * @returns {boolean}
 */
function isArrayIndex(key) {
  const keyNumber = Number(key);
  if (`${keyNumber}` !== key) return false
  return keyNumber >= 0 && keyNumber < 0xff_ff_ff_ff
}

/**
 * @param {URL} packageJsonUrl
 * @param {unknown} target
 * @param {string} subpath
 * @param {string} packageSubpath
 * @param {URL} base
 * @param {boolean} pattern
 * @param {boolean} internal
 * @param {boolean} isPathMap
 * @param {Set<string>|undefined} conditions
 * @returns {URL|null}
 */
function resolvePackageTarget(
  packageJsonUrl,
  target,
  subpath,
  packageSubpath,
  base,
  pattern,
  internal,
  isPathMap,
  conditions
) {
  if (typeof target === 'string') {
    return resolvePackageTargetString(
      target,
      subpath,
      packageSubpath,
      packageJsonUrl,
      base,
      pattern,
      internal,
      isPathMap,
      conditions
    )
  }

  if (Array.isArray(target)) {
    /** @type {Array<unknown>} */
    const targetList = target;
    if (targetList.length === 0) return null

    /** @type {ErrnoException|null|undefined} */
    let lastException;
    let i = -1;

    while (++i < targetList.length) {
      const targetItem = targetList[i];
      /** @type {URL|null} */
      let resolveResult;
      try {
        resolveResult = resolvePackageTarget(
          packageJsonUrl,
          targetItem,
          subpath,
          packageSubpath,
          base,
          pattern,
          internal,
          isPathMap,
          conditions
        );
      } catch (error) {
        const exception = /** @type {ErrnoException} */ (error);
        lastException = exception;
        if (exception.code === 'ERR_INVALID_PACKAGE_TARGET') continue
        throw error
      }

      if (resolveResult === undefined) continue

      if (resolveResult === null) {
        lastException = null;
        continue
      }

      return resolveResult
    }

    if (lastException === undefined || lastException === null) {
      return null
    }

    throw lastException
  }

  if (typeof target === 'object' && target !== null) {
    const keys = Object.getOwnPropertyNames(target);
    let i = -1;

    while (++i < keys.length) {
      const key = keys[i];
      if (isArrayIndex(key)) {
        throw new ERR_INVALID_PACKAGE_CONFIG(
          url.fileURLToPath(packageJsonUrl),
          base,
          '"exports" cannot contain numeric property keys.'
        )
      }
    }

    i = -1;

    while (++i < keys.length) {
      const key = keys[i];
      if (key === 'default' || (conditions && conditions.has(key))) {
        // @ts-expect-error: indexable.
        const conditionalTarget = /** @type {unknown} */ (target[key]);
        const resolveResult = resolvePackageTarget(
          packageJsonUrl,
          conditionalTarget,
          subpath,
          packageSubpath,
          base,
          pattern,
          internal,
          isPathMap,
          conditions
        );
        if (resolveResult === undefined) continue
        return resolveResult
      }
    }

    return null
  }

  if (target === null) {
    return null
  }

  throw invalidPackageTarget(
    packageSubpath,
    target,
    packageJsonUrl,
    internal,
    base
  )
}

/**
 * @param {unknown} exports
 * @param {URL} packageJsonUrl
 * @param {URL} base
 * @returns {boolean}
 */
function isConditionalExportsMainSugar(exports, packageJsonUrl, base) {
  if (typeof exports === 'string' || Array.isArray(exports)) return true
  if (typeof exports !== 'object' || exports === null) return false

  const keys = Object.getOwnPropertyNames(exports);
  let isConditionalSugar = false;
  let i = 0;
  let j = -1;
  while (++j < keys.length) {
    const key = keys[j];
    const curIsConditionalSugar = key === '' || key[0] !== '.';
    if (i++ === 0) {
      isConditionalSugar = curIsConditionalSugar;
    } else if (isConditionalSugar !== curIsConditionalSugar) {
      throw new ERR_INVALID_PACKAGE_CONFIG(
        url.fileURLToPath(packageJsonUrl),
        base,
        '"exports" cannot contain some keys starting with \'.\' and some not.' +
          ' The exports object must either be an object of package subpath keys' +
          ' or an object of main entry condition name keys only.'
      )
    }
  }

  return isConditionalSugar
}

/**
 * @param {string} match
 * @param {URL} pjsonUrl
 * @param {URL} base
 */
function emitTrailingSlashPatternDeprecation(match, pjsonUrl, base) {
  const pjsonPath = url.fileURLToPath(pjsonUrl);
  if (emittedPackageWarnings.has(pjsonPath + '|' + match)) return
  emittedPackageWarnings.add(pjsonPath + '|' + match);
  process$2.emitWarning(
    `Use of deprecated trailing slash pattern mapping "${match}" in the ` +
      `"exports" field module resolution of the package at ${pjsonPath}${
        base ? ` imported from ${url.fileURLToPath(base)}` : ''
      }. Mapping specifiers ending in "/" is no longer supported.`,
    'DeprecationWarning',
    'DEP0155'
  );
}

/**
 * @param {URL} packageJsonUrl
 * @param {string} packageSubpath
 * @param {Record<string, unknown>} packageConfig
 * @param {URL} base
 * @param {Set<string>|undefined} conditions
 * @returns {URL}
 */
function packageExportsResolve(
  packageJsonUrl,
  packageSubpath,
  packageConfig,
  base,
  conditions
) {
  let exports = packageConfig.exports;

  if (isConditionalExportsMainSugar(exports, packageJsonUrl, base)) {
    exports = {'.': exports};
  }

  if (
    own.call(exports, packageSubpath) &&
    !packageSubpath.includes('*') &&
    !packageSubpath.endsWith('/')
  ) {
    // @ts-expect-error: indexable.
    const target = exports[packageSubpath];
    const resolveResult = resolvePackageTarget(
      packageJsonUrl,
      target,
      '',
      packageSubpath,
      base,
      false,
      false,
      false,
      conditions
    );
    if (resolveResult === null || resolveResult === undefined) {
      throw exportsNotFound(packageSubpath, packageJsonUrl, base)
    }

    return resolveResult
  }

  let bestMatch = '';
  let bestMatchSubpath = '';
  const keys = Object.getOwnPropertyNames(exports);
  let i = -1;

  while (++i < keys.length) {
    const key = keys[i];
    const patternIndex = key.indexOf('*');

    if (
      patternIndex !== -1 &&
      packageSubpath.startsWith(key.slice(0, patternIndex))
    ) {
      // When this reaches EOL, this can throw at the top of the whole function:
      //
      // if (StringPrototypeEndsWith(packageSubpath, '/'))
      //   throwInvalidSubpath(packageSubpath)
      //
      // To match "imports" and the spec.
      if (packageSubpath.endsWith('/')) {
        emitTrailingSlashPatternDeprecation(
          packageSubpath,
          packageJsonUrl,
          base
        );
      }

      const patternTrailer = key.slice(patternIndex + 1);

      if (
        packageSubpath.length >= key.length &&
        packageSubpath.endsWith(patternTrailer) &&
        patternKeyCompare(bestMatch, key) === 1 &&
        key.lastIndexOf('*') === patternIndex
      ) {
        bestMatch = key;
        bestMatchSubpath = packageSubpath.slice(
          patternIndex,
          packageSubpath.length - patternTrailer.length
        );
      }
    }
  }

  if (bestMatch) {
    // @ts-expect-error: indexable.
    const target = /** @type {unknown} */ (exports[bestMatch]);
    const resolveResult = resolvePackageTarget(
      packageJsonUrl,
      target,
      bestMatchSubpath,
      bestMatch,
      base,
      true,
      false,
      packageSubpath.endsWith('/'),
      conditions
    );

    if (resolveResult === null || resolveResult === undefined) {
      throw exportsNotFound(packageSubpath, packageJsonUrl, base)
    }

    return resolveResult
  }

  throw exportsNotFound(packageSubpath, packageJsonUrl, base)
}

/**
 * @param {string} a
 * @param {string} b
 */
function patternKeyCompare(a, b) {
  const aPatternIndex = a.indexOf('*');
  const bPatternIndex = b.indexOf('*');
  const baseLengthA = aPatternIndex === -1 ? a.length : aPatternIndex + 1;
  const baseLengthB = bPatternIndex === -1 ? b.length : bPatternIndex + 1;
  if (baseLengthA > baseLengthB) return -1
  if (baseLengthB > baseLengthA) return 1
  if (aPatternIndex === -1) return 1
  if (bPatternIndex === -1) return -1
  if (a.length > b.length) return -1
  if (b.length > a.length) return 1
  return 0
}

/**
 * @param {string} name
 * @param {URL} base
 * @param {Set<string>} [conditions]
 * @returns {URL}
 */
function packageImportsResolve(name, base, conditions) {
  if (name === '#' || name.startsWith('#/') || name.endsWith('/')) {
    const reason = 'is not a valid internal imports specifier name';
    throw new ERR_INVALID_MODULE_SPECIFIER(name, reason, url.fileURLToPath(base))
  }

  /** @type {URL|undefined} */
  let packageJsonUrl;

  const packageConfig = getPackageScopeConfig(base);

  if (packageConfig.exists) {
    packageJsonUrl = url.pathToFileURL(packageConfig.pjsonPath);
    const imports = packageConfig.imports;
    if (imports) {
      if (own.call(imports, name) && !name.includes('*')) {
        const resolveResult = resolvePackageTarget(
          packageJsonUrl,
          imports[name],
          '',
          name,
          base,
          false,
          true,
          false,
          conditions
        );
        if (resolveResult !== null && resolveResult !== undefined) {
          return resolveResult
        }
      } else {
        let bestMatch = '';
        let bestMatchSubpath = '';
        const keys = Object.getOwnPropertyNames(imports);
        let i = -1;

        while (++i < keys.length) {
          const key = keys[i];
          const patternIndex = key.indexOf('*');

          if (patternIndex !== -1 && name.startsWith(key.slice(0, -1))) {
            const patternTrailer = key.slice(patternIndex + 1);
            if (
              name.length >= key.length &&
              name.endsWith(patternTrailer) &&
              patternKeyCompare(bestMatch, key) === 1 &&
              key.lastIndexOf('*') === patternIndex
            ) {
              bestMatch = key;
              bestMatchSubpath = name.slice(
                patternIndex,
                name.length - patternTrailer.length
              );
            }
          }
        }

        if (bestMatch) {
          const target = imports[bestMatch];
          const resolveResult = resolvePackageTarget(
            packageJsonUrl,
            target,
            bestMatchSubpath,
            bestMatch,
            base,
            true,
            true,
            false,
            conditions
          );

          if (resolveResult !== null && resolveResult !== undefined) {
            return resolveResult
          }
        }
      }
    }
  }

  throw importNotDefined(name, packageJsonUrl, base)
}

/**
 * @param {URL} url
 * @returns {PackageType}
 */
function getPackageType(url) {
  const packageConfig = getPackageScopeConfig(url);
  return packageConfig.type
}

/**
 * @param {string} specifier
 * @param {URL} base
 */
function parsePackageName(specifier, base) {
  let separatorIndex = specifier.indexOf('/');
  let validPackageName = true;
  let isScoped = false;
  if (specifier[0] === '@') {
    isScoped = true;
    if (separatorIndex === -1 || specifier.length === 0) {
      validPackageName = false;
    } else {
      separatorIndex = specifier.indexOf('/', separatorIndex + 1);
    }
  }

  const packageName =
    separatorIndex === -1 ? specifier : specifier.slice(0, separatorIndex);

  // Package name cannot have leading . and cannot have percent-encoding or
  // \\ separators.
  if (invalidPackageNameRegEx.exec(packageName) !== null) {
    validPackageName = false;
  }

  if (!validPackageName) {
    throw new ERR_INVALID_MODULE_SPECIFIER(
      specifier,
      'is not a valid package name',
      url.fileURLToPath(base)
    )
  }

  const packageSubpath =
    '.' + (separatorIndex === -1 ? '' : specifier.slice(separatorIndex));

  return {packageName, packageSubpath, isScoped}
}

/**
 * @param {string} specifier
 * @param {URL} base
 * @param {Set<string>|undefined} conditions
 * @returns {URL}
 */
function packageResolve(specifier, base, conditions) {
  if (node_module.builtinModules.includes(specifier)) {
    return new url.URL('node:' + specifier)
  }

  const {packageName, packageSubpath, isScoped} = parsePackageName(
    specifier,
    base
  );

  // ResolveSelf
  const packageConfig = getPackageScopeConfig(base);

  // Can’t test.
  /* c8 ignore next 16 */
  if (packageConfig.exists) {
    const packageJsonUrl = url.pathToFileURL(packageConfig.pjsonPath);
    if (
      packageConfig.name === packageName &&
      packageConfig.exports !== undefined &&
      packageConfig.exports !== null
    ) {
      return packageExportsResolve(
        packageJsonUrl,
        packageSubpath,
        packageConfig,
        base,
        conditions
      )
    }
  }

  let packageJsonUrl = new url.URL(
    './node_modules/' + packageName + '/package.json',
    base
  );
  let packageJsonPath = url.fileURLToPath(packageJsonUrl);
  /** @type {string} */
  let lastPath;
  do {
    const stat = tryStatSync(packageJsonPath.slice(0, -13));
    if (!stat.isDirectory()) {
      lastPath = packageJsonPath;
      packageJsonUrl = new url.URL(
        (isScoped ? '../../../../node_modules/' : '../../../node_modules/') +
          packageName +
          '/package.json',
        packageJsonUrl
      );
      packageJsonPath = url.fileURLToPath(packageJsonUrl);
      continue
    }

    // Package match.
    const packageConfig = getPackageConfig(packageJsonPath, specifier, base);
    if (packageConfig.exports !== undefined && packageConfig.exports !== null) {
      return packageExportsResolve(
        packageJsonUrl,
        packageSubpath,
        packageConfig,
        base,
        conditions
      )
    }

    if (packageSubpath === '.') {
      return legacyMainResolve(packageJsonUrl, packageConfig, base)
    }

    return new url.URL(packageSubpath, packageJsonUrl)
    // Cross-platform root check.
  } while (packageJsonPath.length !== lastPath.length)

  throw new ERR_MODULE_NOT_FOUND(packageName, url.fileURLToPath(base))
}

/**
 * @param {string} specifier
 * @returns {boolean}
 */
function isRelativeSpecifier(specifier) {
  if (specifier[0] === '.') {
    if (specifier.length === 1 || specifier[1] === '/') return true
    if (
      specifier[1] === '.' &&
      (specifier.length === 2 || specifier[2] === '/')
    ) {
      return true
    }
  }

  return false
}

/**
 * @param {string} specifier
 * @returns {boolean}
 */
function shouldBeTreatedAsRelativeOrAbsolutePath(specifier) {
  if (specifier === '') return false
  if (specifier[0] === '/') return true
  return isRelativeSpecifier(specifier)
}

/**
 * The “Resolver Algorithm Specification” as detailed in the Node docs (which is
 * sync and slightly lower-level than `resolve`).
 *
 * @param {string} specifier
 *   `/example.js`, `./example.js`, `../example.js`, `some-package`, `fs`, etc.
 * @param {URL} base
 *   Full URL (to a file) that `specifier` is resolved relative from.
 * @param {Set<string>} [conditions]
 *   Conditions.
 * @param {boolean} [preserveSymlinks]
 *   Keep symlinks instead of resolving them.
 * @returns {URL}
 *   A URL object to the found thing.
 */
function moduleResolve(specifier, base, conditions, preserveSymlinks) {
  const isRemote = base.protocol === 'http:' || base.protocol === 'https:';
  // Order swapped from spec for minor perf gain.
  // Ok since relative URLs cannot parse as URLs.
  /** @type {URL|undefined} */
  let resolved;

  if (shouldBeTreatedAsRelativeOrAbsolutePath(specifier)) {
    resolved = new url.URL(specifier, base);
  } else if (!isRemote && specifier[0] === '#') {
    resolved = packageImportsResolve(specifier, base, conditions);
  } else {
    try {
      resolved = new url.URL(specifier);
    } catch {
      if (!isRemote) {
        resolved = packageResolve(specifier, base, conditions);
      }
    }
  }

  assert$1(typeof resolved !== 'undefined', 'expected to be defined');

  if (resolved.protocol !== 'file:') {
    return resolved
  }

  return finalizeResolution(resolved, base, preserveSymlinks)
}

/**
 * @param {string} specifier
 * @param {URL|undefined} parsed
 * @param {URL|undefined} parsedParentURL
 */
function checkIfDisallowedImport(specifier, parsed, parsedParentURL) {
  if (
    parsed &&
    parsedParentURL &&
    (parsedParentURL.protocol === 'http:' ||
      parsedParentURL.protocol === 'https:')
  ) {
    if (shouldBeTreatedAsRelativeOrAbsolutePath(specifier)) {
      // Data: and blob: disallowed due to allowing file: access via
      // indirection
      if (
        parsed &&
        parsed.protocol !== 'https:' &&
        parsed.protocol !== 'http:'
      ) {
        throw new ERR_NETWORK_IMPORT_DISALLOWED(
          specifier,
          parsedParentURL,
          'remote imports cannot import from a local location.'
        )
      }

      return {url: parsed.href}
    }

    if (node_module.builtinModules.includes(specifier)) {
      throw new ERR_NETWORK_IMPORT_DISALLOWED(
        specifier,
        parsedParentURL,
        'remote imports cannot import from a local location.'
      )
    }

    throw new ERR_NETWORK_IMPORT_DISALLOWED(
      specifier,
      parsedParentURL,
      'only relative and absolute specifiers are supported.'
    )
  }
}

/**
 * @param {URL} url
 */
function throwIfUnsupportedURLProtocol(url) {
  if (
    url.protocol !== 'file:' &&
    url.protocol !== 'data:' &&
    url.protocol !== 'node:'
  ) {
    throw new ERR_UNSUPPORTED_ESM_URL_SCHEME(url)
  }
}

/**
 * @param {URL|undefined} parsed
 * @param {boolean} experimentalNetworkImports
 */
function throwIfUnsupportedURLScheme(parsed, experimentalNetworkImports) {
  if (
    parsed &&
    parsed.protocol !== 'file:' &&
    parsed.protocol !== 'data:' &&
    (!experimentalNetworkImports ||
      (parsed.protocol !== 'https:' && parsed.protocol !== 'http:'))
  ) {
    throw new ERR_UNSUPPORTED_ESM_URL_SCHEME(
      parsed,
      ['file', 'data'].concat(
        experimentalNetworkImports ? ['https', 'http'] : []
      )
    )
  }
}

/**
 * @param {string} specifier
 * @param {{parentURL?: string, conditions?: Array<string>}} context
 * @returns {{url: string, format?: string|null}}
 */
function defaultResolve(specifier, context = {}) {
  const {parentURL} = context;
  assert$1(typeof parentURL !== 'undefined', 'expected `parentURL` to be defined');

  /** @type {URL|undefined} */
  let parsedParentURL;
  if (parentURL) {
    try {
      parsedParentURL = new url.URL(parentURL);
    } catch {
      // Ignore exception
    }
  }

  /** @type {URL|undefined} */
  let parsed;
  try {
    parsed = shouldBeTreatedAsRelativeOrAbsolutePath(specifier)
      ? new url.URL(specifier, parsedParentURL)
      : new url.URL(specifier);

    if (
      parsed.protocol === 'data:' ||
      (experimentalNetworkImports &&
        (parsed.protocol === 'https:' || parsed.protocol === 'http:'))
    ) {
      return {url: parsed.href, format: null}
    }
  } catch {
    // Ignore exception
  }

  // There are multiple deep branches that can either throw or return; instead
  // of duplicating that deeply nested logic for the possible returns, DRY and
  // check for a return. This seems the least gnarly.
  const maybeReturn = checkIfDisallowedImport(
    specifier,
    parsed,
    parsedParentURL
  );

  if (maybeReturn) return maybeReturn

  // This must come after checkIfDisallowedImport
  if (parsed && parsed.protocol === 'node:') return {url: specifier}

  throwIfUnsupportedURLScheme(parsed, experimentalNetworkImports);

  const conditions = getConditionsSet(context.conditions);

  const url$1 = moduleResolve(specifier, new url.URL(parentURL), conditions, false);

  throwIfUnsupportedURLProtocol(url$1);

  return {
    // Do NOT cast `url` to a string: that will work even when there are real
    // problems, silencing them
    url: url$1.href,
    format: defaultGetFormatWithoutErrors(url$1, {parentURL})
  }
}

/**
 * @typedef {import('./lib/errors.js').ErrnoException} ErrnoException
 */

/**
 * Match `import.meta.resolve` except that `parent` is required (you can pass
 * `import.meta.url`).
 *
 * @param {string} specifier
 *   The module specifier to resolve relative to parent
 *   (`/example.js`, `./example.js`, `../example.js`, `some-package`, `fs`,
 *   etc).
 * @param {string} parent
 *   The absolute parent module URL to resolve from.
 *   You should pass `import.meta.url` or something else.
 * @returns {Promise<string>}
 *   Returns a promise that resolves to a full `file:`, `data:`, or `node:` URL
 *   to the found thing.
 */
async function resolve(specifier, parent) {
  if (!parent) {
    throw new Error(
      'Please pass `parent`: `import-meta-resolve` cannot ponyfill that'
    )
  }

  try {
    return defaultResolve(specifier, {parentURL: parent}).url
  } catch (error) {
    const exception = /** @type {ErrnoException} */ (error);

    return exception.code === 'ERR_UNSUPPORTED_DIR_IMPORT' &&
      typeof exception.url === 'string'
      ? exception.url
      : Promise.reject(error)
  }
}

/* eslint-disable @typescript-eslint/no-unsafe-call */
/**
    Bundles all dependencies with Rollup to produce a CommonJS bundle
*/
async function createCommonjsBundles({ pkgPath, pkg, rollupOptions, cwd = process$2.cwd(), }) {
    if (pkg.exports === undefined || pkg.exports === null) {
        console.info('The `exports` property of `package.json` was not set; skipping creation of CommonJS bundles');
        return;
    }
    const browser = rollupOptions?.browser;
    delete rollupOptions?.browser;
    const entryPoints = [];
    if (typeof pkg.exports === 'string') {
        entryPoints.push({ sourcePath: '.', destinationPath: pkg.exports });
    }
    else {
        const exportsKeys = Object.entries(pkg.exports);
        for (const [exportsKey, exportsValue] of exportsKeys) {
            if (exportsKey.startsWith('.')) {
                if (exportsValue === null)
                    continue;
                // We don't support star paths
                if (exportsKey.includes('*'))
                    continue;
                if (typeof exportsValue === 'string') {
                    entryPoints.push({
                        sourcePath: exportsKey,
                        destinationPath: exportsValue,
                    });
                }
                else if ('import' in exportsValue &&
                    typeof exportsValue.import === 'string') {
                    entryPoints.push({
                        sourcePath: exportsKey,
                        destinationPath: exportsValue.import,
                    });
                }
            }
            else if (exportsKey === 'import' && typeof exportsValue === 'string') {
                entryPoints.push({ sourcePath: '.', destinationPath: exportsValue });
            }
        }
    }
    const pkgDir = path__namespace.dirname(pkgPath);
    const tsconfigPath = path__namespace.join(pkgDir, 'tsconfig.json');
    // Weird typing for `plugins` comes from rollup
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const plugins = [
        jsImports(),
        bundleESM(),
        depsExternal({ packagePath: pkgPath }),
        json(),
        browser
            ? pluginNodeResolve.nodeResolve({
                browser: true,
            })
            : pluginNodeResolve.nodeResolve({
                // Need to remove `default` from the list because some libraries have `default` pointing to the browser version of the package
                exportConditions: ['node', 'module', 'import'],
            }),
        commonjs(),
    ];
    if (rollupOptions?.extendPlugins !== undefined) {
        plugins.push(...rollupOptions.extendPlugins);
    }
    if (fs__namespace.existsSync(tsconfigPath)) {
        plugins.push(typescript({
            outputToFilesystem: true,
            tsconfig: tsconfigPath,
            tslib: url.fileURLToPath(await resolve('tslib', (typeof document === 'undefined' ? new (require('u' + 'rl').URL)('file:' + __filename).href : (document.currentScript && document.currentScript.src || new URL('index.cjs', document.baseURI).href)))),
        }));
    }
    let external = node_module.builtinModules.flatMap((module) => [
        module,
        `node:${module}`,
    ]);
    if (rollupOptions?.external) {
        if (typeof rollupOptions.external === 'function') {
            external = rollupOptions.external;
        }
        else {
            external.push(...[rollupOptions.external].flat());
        }
    }
    await Promise.all(entryPoints.map(async (entryPoint) => {
        if (pkg.type === 'module') {
            if (!/\.(ts|js|mjs)$/.test(entryPoint.destinationPath))
                return;
        }
        else {
            if (!/\.(ts|mjs)$/.test(entryPoint.destinationPath))
                return;
        }
        const bundle = await rollup.rollup({
            plugins,
            input: path__namespace.join(pkgDir, entryPoint.destinationPath),
            ...rollupOptions,
            external,
        });
        const commonjsDestinationPath = entryPoint.destinationPath
            .replace(/\/src\//, '/')
            .replace(/\.(m|c)?ts$/, '.cjs');
        await fs__namespace.promises.mkdir(path__namespace.join(cwd, 'dist'), { recursive: true });
        await bundle.write({
            file: path__namespace.join(cwd, commonjsDestinationPath),
            format: 'commonjs',
            inlineDynamicImports: true,
        });
    }));
    const exportsObject = {};
    for (const entryPoint of entryPoints) {
        const entryPointFileName = path__namespace.parse(entryPoint.destinationPath).name;
        exportsObject[entryPoint.sourcePath] = {
            types: `./${entryPointFileName}.d.ts`,
            import: `./${entryPointFileName}.js`,
            require: `./${entryPointFileName}.cjs`,
        };
    }
    pkg.exports = exportsObject;
}

/**
    Rewrites `./dist/<path>` and `./src/<path>` paths in an object to `./<path>` paths
    @param json An object or JSON string
    @returns An object with the dist paths
*/
function rewritePackageJsonPaths(pkg) {
    for (const property of deepKeys(pkg)) {
        let value = getProperty(pkg, property);
        if (typeof value === 'string') {
            if (value.startsWith('./dist')) {
                value = value.replace(/^\.\/dist\//, './');
            }
            else if (value.startsWith('./src')) {
                value = value.replace(/^\.\/src\//, './');
            }
            if (value.endsWith('.ts') && !value.endsWith('.d.ts')) {
                value = value.replace(/\.ts$/, '.js');
            }
        }
        setProperty(pkg, property, value);
    }
    return pkg;
}
function removePreinstallScript(pkg) {
    if (pkg.scripts?.preinstall === 'pnpm build') {
        delete pkg.scripts.preinstall;
    }
    return pkg;
}
const clone = rfdc();
/**
    Transforms a `package.json` file from a source package.json to a distribution package.json to be published onto `npm`
 */
async function transformPackageJson(props = {}) {
    const commonjs = props.commonjs ?? true;
    let pkg;
    let pkgPath;
    if ('pkg' in props) {
        pkg = clone(props.pkg);
        pkgPath = props.pkgPath;
    }
    else {
        pkg = JSON.parse(await fs__namespace.promises.readFile('package.json', 'utf8'));
        pkgPath = path__namespace.join(props.cwd ?? process$2.cwd(), 'package.json');
    }
    if (commonjs !== false) {
        const rollupOptions = typeof commonjs === 'object' ? commonjs : undefined;
        await createCommonjsBundles({
            pkg,
            pkgPath,
            rollupOptions,
        });
    }
    rewritePackageJsonPaths(pkg);
    removePreinstallScript(pkg);
    return pkg;
}

/* eslint-disable no-await-in-loop */
const packageFiles = ['readme.md', 'license', 'package.json'];
async function copyPackageFiles({ additionalFiles, commonjs, cwd = process$2.cwd(), } = {}) {
    const distDir = path__namespace.join(cwd, 'dist');
    if (!fs__namespace.existsSync(distDir)) {
        fs__namespace.mkdirSync(distDir, { recursive: true });
    }
    const monorepoRoot = lionUtils.getProjectDir(cwd, { monorepoRoot: true });
    for (const packageFilePath of [...packageFiles, ...(additionalFiles ?? [])]) {
        let distPackageFilePath;
        if (packageFilePath.startsWith('src') ||
            packageFilePath.startsWith('./src')) {
            distPackageFilePath = path__namespace.join(distDir, packageFilePath.replace(/^(\.\/)?src\//, ''));
        }
        else {
            distPackageFilePath = path__namespace.join(distDir, packageFilePath);
        }
        const packageFileFullPath = path__namespace.resolve(cwd, packageFilePath);
        if (fs__namespace.existsSync(packageFileFullPath)) {
            await fs__namespace.promises.cp(packageFileFullPath, distPackageFilePath, {
                recursive: true,
            });
            if (path__namespace.parse(packageFilePath).base === 'package.json') {
                const transformedPackageJson = await transformPackageJson({
                    pkg: JSON.parse(await fs__namespace.promises.readFile(packageFileFullPath, 'utf8')),
                    pkgPath: packageFileFullPath,
                    commonjs,
                });
                await fs__namespace.promises.writeFile(distPackageFilePath, JSON.stringify(transformedPackageJson, null, '\t'));
            }
        }
        // If the project is a monorepo, try copying the project files from the monorepo root
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        else if (monorepoRoot !== undefined) {
            // Don't copy monorepo package.json files
            if (packageFilePath === 'package.json') {
                continue;
            }
            const monorepoFilePath = path__namespace.join(monorepoRoot, packageFilePath);
            if (fs__namespace.existsSync(monorepoFilePath)) {
                await fs__namespace.promises.cp(monorepoFilePath, distPackageFilePath, {
                    recursive: true,
                });
            }
        }
    }
}

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

var crossSpawn = {exports: {}};

var windows;
var hasRequiredWindows;

function requireWindows () {
	if (hasRequiredWindows) return windows;
	hasRequiredWindows = 1;
	windows = isexe;
	isexe.sync = sync;

	var fs = require$$0;

	function checkPathExt (path, options) {
	  var pathext = options.pathExt !== undefined ?
	    options.pathExt : process.env.PATHEXT;

	  if (!pathext) {
	    return true
	  }

	  pathext = pathext.split(';');
	  if (pathext.indexOf('') !== -1) {
	    return true
	  }
	  for (var i = 0; i < pathext.length; i++) {
	    var p = pathext[i].toLowerCase();
	    if (p && path.substr(-p.length).toLowerCase() === p) {
	      return true
	    }
	  }
	  return false
	}

	function checkStat (stat, path, options) {
	  if (!stat.isSymbolicLink() && !stat.isFile()) {
	    return false
	  }
	  return checkPathExt(path, options)
	}

	function isexe (path, options, cb) {
	  fs.stat(path, function (er, stat) {
	    cb(er, er ? false : checkStat(stat, path, options));
	  });
	}

	function sync (path, options) {
	  return checkStat(fs.statSync(path), path, options)
	}
	return windows;
}

var mode;
var hasRequiredMode;

function requireMode () {
	if (hasRequiredMode) return mode;
	hasRequiredMode = 1;
	mode = isexe;
	isexe.sync = sync;

	var fs = require$$0;

	function isexe (path, options, cb) {
	  fs.stat(path, function (er, stat) {
	    cb(er, er ? false : checkStat(stat, options));
	  });
	}

	function sync (path, options) {
	  return checkStat(fs.statSync(path), options)
	}

	function checkStat (stat, options) {
	  return stat.isFile() && checkMode(stat, options)
	}

	function checkMode (stat, options) {
	  var mod = stat.mode;
	  var uid = stat.uid;
	  var gid = stat.gid;

	  var myUid = options.uid !== undefined ?
	    options.uid : process.getuid && process.getuid();
	  var myGid = options.gid !== undefined ?
	    options.gid : process.getgid && process.getgid();

	  var u = parseInt('100', 8);
	  var g = parseInt('010', 8);
	  var o = parseInt('001', 8);
	  var ug = u | g;

	  var ret = (mod & o) ||
	    (mod & g) && gid === myGid ||
	    (mod & u) && uid === myUid ||
	    (mod & ug) && myUid === 0;

	  return ret
	}
	return mode;
}

var core;
if (process.platform === 'win32' || commonjsGlobal.TESTING_WINDOWS) {
  core = requireWindows();
} else {
  core = requireMode();
}

var isexe_1 = isexe$1;
isexe$1.sync = sync;

function isexe$1 (path, options, cb) {
  if (typeof options === 'function') {
    cb = options;
    options = {};
  }

  if (!cb) {
    if (typeof Promise !== 'function') {
      throw new TypeError('callback not provided')
    }

    return new Promise(function (resolve, reject) {
      isexe$1(path, options || {}, function (er, is) {
        if (er) {
          reject(er);
        } else {
          resolve(is);
        }
      });
    })
  }

  core(path, options || {}, function (er, is) {
    // ignore EACCES because that just means we aren't allowed to run it
    if (er) {
      if (er.code === 'EACCES' || options && options.ignoreErrors) {
        er = null;
        is = false;
      }
    }
    cb(er, is);
  });
}

function sync (path, options) {
  // my kingdom for a filtered catch
  try {
    return core.sync(path, options || {})
  } catch (er) {
    if (options && options.ignoreErrors || er.code === 'EACCES') {
      return false
    } else {
      throw er
    }
  }
}

const isWindows = process.platform === 'win32' ||
    process.env.OSTYPE === 'cygwin' ||
    process.env.OSTYPE === 'msys';

const path$2 = require$$0$1;
const COLON = isWindows ? ';' : ':';
const isexe = isexe_1;

const getNotFoundError = (cmd) =>
  Object.assign(new Error(`not found: ${cmd}`), { code: 'ENOENT' });

const getPathInfo = (cmd, opt) => {
  const colon = opt.colon || COLON;

  // If it has a slash, then we don't bother searching the pathenv.
  // just check the file itself, and that's it.
  const pathEnv = cmd.match(/\//) || isWindows && cmd.match(/\\/) ? ['']
    : (
      [
        // windows always checks the cwd first
        ...(isWindows ? [process.cwd()] : []),
        ...(opt.path || process.env.PATH ||
          /* istanbul ignore next: very unusual */ '').split(colon),
      ]
    );
  const pathExtExe = isWindows
    ? opt.pathExt || process.env.PATHEXT || '.EXE;.CMD;.BAT;.COM'
    : '';
  const pathExt = isWindows ? pathExtExe.split(colon) : [''];

  if (isWindows) {
    if (cmd.indexOf('.') !== -1 && pathExt[0] !== '')
      pathExt.unshift('');
  }

  return {
    pathEnv,
    pathExt,
    pathExtExe,
  }
};

const which$1 = (cmd, opt, cb) => {
  if (typeof opt === 'function') {
    cb = opt;
    opt = {};
  }
  if (!opt)
    opt = {};

  const { pathEnv, pathExt, pathExtExe } = getPathInfo(cmd, opt);
  const found = [];

  const step = i => new Promise((resolve, reject) => {
    if (i === pathEnv.length)
      return opt.all && found.length ? resolve(found)
        : reject(getNotFoundError(cmd))

    const ppRaw = pathEnv[i];
    const pathPart = /^".*"$/.test(ppRaw) ? ppRaw.slice(1, -1) : ppRaw;

    const pCmd = path$2.join(pathPart, cmd);
    const p = !pathPart && /^\.[\\\/]/.test(cmd) ? cmd.slice(0, 2) + pCmd
      : pCmd;

    resolve(subStep(p, i, 0));
  });

  const subStep = (p, i, ii) => new Promise((resolve, reject) => {
    if (ii === pathExt.length)
      return resolve(step(i + 1))
    const ext = pathExt[ii];
    isexe(p + ext, { pathExt: pathExtExe }, (er, is) => {
      if (!er && is) {
        if (opt.all)
          found.push(p + ext);
        else
          return resolve(p + ext)
      }
      return resolve(subStep(p, i, ii + 1))
    });
  });

  return cb ? step(0).then(res => cb(null, res), cb) : step(0)
};

const whichSync = (cmd, opt) => {
  opt = opt || {};

  const { pathEnv, pathExt, pathExtExe } = getPathInfo(cmd, opt);
  const found = [];

  for (let i = 0; i < pathEnv.length; i ++) {
    const ppRaw = pathEnv[i];
    const pathPart = /^".*"$/.test(ppRaw) ? ppRaw.slice(1, -1) : ppRaw;

    const pCmd = path$2.join(pathPart, cmd);
    const p = !pathPart && /^\.[\\\/]/.test(cmd) ? cmd.slice(0, 2) + pCmd
      : pCmd;

    for (let j = 0; j < pathExt.length; j ++) {
      const cur = p + pathExt[j];
      try {
        const is = isexe.sync(cur, { pathExt: pathExtExe });
        if (is) {
          if (opt.all)
            found.push(cur);
          else
            return cur
        }
      } catch (ex) {}
    }
  }

  if (opt.all && found.length)
    return found

  if (opt.nothrow)
    return null

  throw getNotFoundError(cmd)
};

var which_1 = which$1;
which$1.sync = whichSync;

var pathKey$2 = {exports: {}};

const pathKey$1 = (options = {}) => {
	const environment = options.env || process.env;
	const platform = options.platform || process.platform;

	if (platform !== 'win32') {
		return 'PATH';
	}

	return Object.keys(environment).reverse().find(key => key.toUpperCase() === 'PATH') || 'Path';
};

pathKey$2.exports = pathKey$1;
// TODO: Remove this for the next major release
pathKey$2.exports.default = pathKey$1;

const path$1 = require$$0$1;
const which = which_1;
const getPathKey = pathKey$2.exports;

function resolveCommandAttempt(parsed, withoutPathExt) {
    const env = parsed.options.env || process.env;
    const cwd = process.cwd();
    const hasCustomCwd = parsed.options.cwd != null;
    // Worker threads do not have process.chdir()
    const shouldSwitchCwd = hasCustomCwd && process.chdir !== undefined && !process.chdir.disabled;

    // If a custom `cwd` was specified, we need to change the process cwd
    // because `which` will do stat calls but does not support a custom cwd
    if (shouldSwitchCwd) {
        try {
            process.chdir(parsed.options.cwd);
        } catch (err) {
            /* Empty */
        }
    }

    let resolved;

    try {
        resolved = which.sync(parsed.command, {
            path: env[getPathKey({ env })],
            pathExt: withoutPathExt ? path$1.delimiter : undefined,
        });
    } catch (e) {
        /* Empty */
    } finally {
        if (shouldSwitchCwd) {
            process.chdir(cwd);
        }
    }

    // If we successfully resolved, ensure that an absolute path is returned
    // Note that when a custom `cwd` was used, we need to resolve to an absolute path based on it
    if (resolved) {
        resolved = path$1.resolve(hasCustomCwd ? parsed.options.cwd : '', resolved);
    }

    return resolved;
}

function resolveCommand$1(parsed) {
    return resolveCommandAttempt(parsed) || resolveCommandAttempt(parsed, true);
}

var resolveCommand_1 = resolveCommand$1;

var _escape = {};

// See http://www.robvanderwoude.com/escapechars.php
const metaCharsRegExp = /([()\][%!^"`<>&|;, *?])/g;

function escapeCommand(arg) {
    // Escape meta chars
    arg = arg.replace(metaCharsRegExp, '^$1');

    return arg;
}

function escapeArgument(arg, doubleEscapeMetaChars) {
    // Convert to string
    arg = `${arg}`;

    // Algorithm below is based on https://qntm.org/cmd

    // Sequence of backslashes followed by a double quote:
    // double up all the backslashes and escape the double quote
    arg = arg.replace(/(\\*)"/g, '$1$1\\"');

    // Sequence of backslashes followed by the end of the string
    // (which will become a double quote later):
    // double up all the backslashes
    arg = arg.replace(/(\\*)$/, '$1$1');

    // All other backslashes occur literally

    // Quote the whole thing:
    arg = `"${arg}"`;

    // Escape meta chars
    arg = arg.replace(metaCharsRegExp, '^$1');

    // Double escape meta chars if necessary
    if (doubleEscapeMetaChars) {
        arg = arg.replace(metaCharsRegExp, '^$1');
    }

    return arg;
}

_escape.command = escapeCommand;
_escape.argument = escapeArgument;

var shebangRegex$1 = /^#!(.*)/;

const shebangRegex = shebangRegex$1;

var shebangCommand$1 = (string = '') => {
	const match = string.match(shebangRegex);

	if (!match) {
		return null;
	}

	const [path, argument] = match[0].replace(/#! ?/, '').split(' ');
	const binary = path.split('/').pop();

	if (binary === 'env') {
		return argument;
	}

	return argument ? `${binary} ${argument}` : binary;
};

const fs = require$$0;
const shebangCommand = shebangCommand$1;

function readShebang$1(command) {
    // Read the first 150 bytes from the file
    const size = 150;
    const buffer = Buffer.alloc(size);

    let fd;

    try {
        fd = fs.openSync(command, 'r');
        fs.readSync(fd, buffer, 0, size, 0);
        fs.closeSync(fd);
    } catch (e) { /* Empty */ }

    // Attempt to extract shebang (null is returned if not a shebang)
    return shebangCommand(buffer.toString());
}

var readShebang_1 = readShebang$1;

const path = require$$0$1;
const resolveCommand = resolveCommand_1;
const escape = _escape;
const readShebang = readShebang_1;

const isWin$2 = process.platform === 'win32';
const isExecutableRegExp = /\.(?:com|exe)$/i;
const isCmdShimRegExp = /node_modules[\\/].bin[\\/][^\\/]+\.cmd$/i;

function detectShebang(parsed) {
    parsed.file = resolveCommand(parsed);

    const shebang = parsed.file && readShebang(parsed.file);

    if (shebang) {
        parsed.args.unshift(parsed.file);
        parsed.command = shebang;

        return resolveCommand(parsed);
    }

    return parsed.file;
}

function parseNonShell(parsed) {
    if (!isWin$2) {
        return parsed;
    }

    // Detect & add support for shebangs
    const commandFile = detectShebang(parsed);

    // We don't need a shell if the command filename is an executable
    const needsShell = !isExecutableRegExp.test(commandFile);

    // If a shell is required, use cmd.exe and take care of escaping everything correctly
    // Note that `forceShell` is an hidden option used only in tests
    if (parsed.options.forceShell || needsShell) {
        // Need to double escape meta chars if the command is a cmd-shim located in `node_modules/.bin/`
        // The cmd-shim simply calls execute the package bin file with NodeJS, proxying any argument
        // Because the escape of metachars with ^ gets interpreted when the cmd.exe is first called,
        // we need to double escape them
        const needsDoubleEscapeMetaChars = isCmdShimRegExp.test(commandFile);

        // Normalize posix paths into OS compatible paths (e.g.: foo/bar -> foo\bar)
        // This is necessary otherwise it will always fail with ENOENT in those cases
        parsed.command = path.normalize(parsed.command);

        // Escape command & arguments
        parsed.command = escape.command(parsed.command);
        parsed.args = parsed.args.map((arg) => escape.argument(arg, needsDoubleEscapeMetaChars));

        const shellCommand = [parsed.command].concat(parsed.args).join(' ');

        parsed.args = ['/d', '/s', '/c', `"${shellCommand}"`];
        parsed.command = process.env.comspec || 'cmd.exe';
        parsed.options.windowsVerbatimArguments = true; // Tell node's spawn that the arguments are already escaped
    }

    return parsed;
}

function parse$1(command, args, options) {
    // Normalize arguments, similar to nodejs
    if (args && !Array.isArray(args)) {
        options = args;
        args = null;
    }

    args = args ? args.slice(0) : []; // Clone array to avoid changing the original
    options = Object.assign({}, options); // Clone object to avoid changing the original

    // Build our parsed object
    const parsed = {
        command,
        args,
        options,
        file: undefined,
        original: {
            command,
            args,
        },
    };

    // Delegate further parsing to shell or non-shell
    return options.shell ? parsed : parseNonShell(parsed);
}

var parse_1 = parse$1;

const isWin$1 = process.platform === 'win32';

function notFoundError(original, syscall) {
    return Object.assign(new Error(`${syscall} ${original.command} ENOENT`), {
        code: 'ENOENT',
        errno: 'ENOENT',
        syscall: `${syscall} ${original.command}`,
        path: original.command,
        spawnargs: original.args,
    });
}

function hookChildProcess(cp, parsed) {
    if (!isWin$1) {
        return;
    }

    const originalEmit = cp.emit;

    cp.emit = function (name, arg1) {
        // If emitting "exit" event and exit code is 1, we need to check if
        // the command exists and emit an "error" instead
        // See https://github.com/IndigoUnited/node-cross-spawn/issues/16
        if (name === 'exit') {
            const err = verifyENOENT(arg1, parsed);

            if (err) {
                return originalEmit.call(cp, 'error', err);
            }
        }

        return originalEmit.apply(cp, arguments); // eslint-disable-line prefer-rest-params
    };
}

function verifyENOENT(status, parsed) {
    if (isWin$1 && status === 1 && !parsed.file) {
        return notFoundError(parsed.original, 'spawn');
    }

    return null;
}

function verifyENOENTSync(status, parsed) {
    if (isWin$1 && status === 1 && !parsed.file) {
        return notFoundError(parsed.original, 'spawnSync');
    }

    return null;
}

var enoent$1 = {
    hookChildProcess,
    verifyENOENT,
    verifyENOENTSync,
    notFoundError,
};

const cp = require$$0$2;
const parse = parse_1;
const enoent = enoent$1;

function spawn(command, args, options) {
    // Parse the arguments
    const parsed = parse(command, args, options);

    // Spawn the child process
    const spawned = cp.spawn(parsed.command, parsed.args, parsed.options);

    // Hook into child process "exit" event to emit an error if the command
    // does not exists, see: https://github.com/IndigoUnited/node-cross-spawn/issues/16
    enoent.hookChildProcess(spawned, parsed);

    return spawned;
}

function spawnSync(command, args, options) {
    // Parse the arguments
    const parsed = parse(command, args, options);

    // Spawn the child process
    const result = cp.spawnSync(parsed.command, parsed.args, parsed.options);

    // Analyze if the command does not exist, see: https://github.com/IndigoUnited/node-cross-spawn/issues/16
    result.error = result.error || enoent.verifyENOENTSync(result.status, parsed);

    return result;
}

crossSpawn.exports = spawn;
crossSpawn.exports.spawn = spawn;
crossSpawn.exports.sync = spawnSync;

crossSpawn.exports._parse = parse;
crossSpawn.exports._enoent = enoent;

function stripFinalNewline(input) {
	const LF = typeof input === 'string' ? '\n' : '\n'.charCodeAt();
	const CR = typeof input === 'string' ? '\r' : '\r'.charCodeAt();

	if (input[input.length - 1] === LF) {
		input = input.slice(0, -1);
	}

	if (input[input.length - 1] === CR) {
		input = input.slice(0, -1);
	}

	return input;
}

function pathKey(options = {}) {
	const {
		env = process.env,
		platform = process.platform
	} = options;

	if (platform !== 'win32') {
		return 'PATH';
	}

	return Object.keys(env).reverse().find(key => key.toUpperCase() === 'PATH') || 'Path';
}

function npmRunPath(options = {}) {
	const {
		cwd = process$2.cwd(),
		path: path_ = process$2.env[pathKey()],
		execPath = process$2.execPath,
	} = options;

	let previous;
	const cwdString = cwd instanceof URL ? url.fileURLToPath(cwd) : cwd;
	let cwdPath = path$3.resolve(cwdString);
	const result = [];

	while (previous !== cwdPath) {
		result.push(path$3.join(cwdPath, 'node_modules/.bin'));
		previous = cwdPath;
		cwdPath = path$3.resolve(cwdPath, '..');
	}

	// Ensure the running `node` binary is used.
	result.push(path$3.resolve(cwdString, execPath, '..'));

	return [...result, path_].join(path$3.delimiter);
}

function npmRunPathEnv({env = process$2.env, ...options} = {}) {
	env = {...env};

	const path = pathKey({env});
	options.path = env[path];
	env[path] = npmRunPath(options);

	return env;
}

const getRealtimeSignals=function(){
const length=SIGRTMAX-SIGRTMIN+1;
return Array.from({length},getRealtimeSignal);
};

const getRealtimeSignal=function(value,index){
return {
name:`SIGRT${index+1}`,
number:SIGRTMIN+index,
action:"terminate",
description:"Application-specific signal (realtime)",
standard:"posix"};

};

const SIGRTMIN=34;
const SIGRTMAX=64;

const SIGNALS=[
{
name:"SIGHUP",
number:1,
action:"terminate",
description:"Terminal closed",
standard:"posix"},

{
name:"SIGINT",
number:2,
action:"terminate",
description:"User interruption with CTRL-C",
standard:"ansi"},

{
name:"SIGQUIT",
number:3,
action:"core",
description:"User interruption with CTRL-\\",
standard:"posix"},

{
name:"SIGILL",
number:4,
action:"core",
description:"Invalid machine instruction",
standard:"ansi"},

{
name:"SIGTRAP",
number:5,
action:"core",
description:"Debugger breakpoint",
standard:"posix"},

{
name:"SIGABRT",
number:6,
action:"core",
description:"Aborted",
standard:"ansi"},

{
name:"SIGIOT",
number:6,
action:"core",
description:"Aborted",
standard:"bsd"},

{
name:"SIGBUS",
number:7,
action:"core",
description:
"Bus error due to misaligned, non-existing address or paging error",
standard:"bsd"},

{
name:"SIGEMT",
number:7,
action:"terminate",
description:"Command should be emulated but is not implemented",
standard:"other"},

{
name:"SIGFPE",
number:8,
action:"core",
description:"Floating point arithmetic error",
standard:"ansi"},

{
name:"SIGKILL",
number:9,
action:"terminate",
description:"Forced termination",
standard:"posix",
forced:true},

{
name:"SIGUSR1",
number:10,
action:"terminate",
description:"Application-specific signal",
standard:"posix"},

{
name:"SIGSEGV",
number:11,
action:"core",
description:"Segmentation fault",
standard:"ansi"},

{
name:"SIGUSR2",
number:12,
action:"terminate",
description:"Application-specific signal",
standard:"posix"},

{
name:"SIGPIPE",
number:13,
action:"terminate",
description:"Broken pipe or socket",
standard:"posix"},

{
name:"SIGALRM",
number:14,
action:"terminate",
description:"Timeout or timer",
standard:"posix"},

{
name:"SIGTERM",
number:15,
action:"terminate",
description:"Termination",
standard:"ansi"},

{
name:"SIGSTKFLT",
number:16,
action:"terminate",
description:"Stack is empty or overflowed",
standard:"other"},

{
name:"SIGCHLD",
number:17,
action:"ignore",
description:"Child process terminated, paused or unpaused",
standard:"posix"},

{
name:"SIGCLD",
number:17,
action:"ignore",
description:"Child process terminated, paused or unpaused",
standard:"other"},

{
name:"SIGCONT",
number:18,
action:"unpause",
description:"Unpaused",
standard:"posix",
forced:true},

{
name:"SIGSTOP",
number:19,
action:"pause",
description:"Paused",
standard:"posix",
forced:true},

{
name:"SIGTSTP",
number:20,
action:"pause",
description:"Paused using CTRL-Z or \"suspend\"",
standard:"posix"},

{
name:"SIGTTIN",
number:21,
action:"pause",
description:"Background process cannot read terminal input",
standard:"posix"},

{
name:"SIGBREAK",
number:21,
action:"terminate",
description:"User interruption with CTRL-BREAK",
standard:"other"},

{
name:"SIGTTOU",
number:22,
action:"pause",
description:"Background process cannot write to terminal output",
standard:"posix"},

{
name:"SIGURG",
number:23,
action:"ignore",
description:"Socket received out-of-band data",
standard:"bsd"},

{
name:"SIGXCPU",
number:24,
action:"core",
description:"Process timed out",
standard:"bsd"},

{
name:"SIGXFSZ",
number:25,
action:"core",
description:"File too big",
standard:"bsd"},

{
name:"SIGVTALRM",
number:26,
action:"terminate",
description:"Timeout or timer",
standard:"bsd"},

{
name:"SIGPROF",
number:27,
action:"terminate",
description:"Timeout or timer",
standard:"bsd"},

{
name:"SIGWINCH",
number:28,
action:"ignore",
description:"Terminal window size changed",
standard:"bsd"},

{
name:"SIGIO",
number:29,
action:"terminate",
description:"I/O is available",
standard:"other"},

{
name:"SIGPOLL",
number:29,
action:"terminate",
description:"Watched event",
standard:"other"},

{
name:"SIGINFO",
number:29,
action:"ignore",
description:"Request for process information",
standard:"other"},

{
name:"SIGPWR",
number:30,
action:"terminate",
description:"Device running out of power",
standard:"systemv"},

{
name:"SIGSYS",
number:31,
action:"core",
description:"Invalid system call",
standard:"other"},

{
name:"SIGUNUSED",
number:31,
action:"terminate",
description:"Invalid system call",
standard:"other"}];

const getSignals=function(){
const realtimeSignals=getRealtimeSignals();
const signals=[...SIGNALS,...realtimeSignals].map(normalizeSignal);
return signals;
};







const normalizeSignal=function({
name,
number:defaultNumber,
description,
action,
forced=false,
standard})
{
const{
signals:{[name]:constantSignal}}=
os.constants;
const supported=constantSignal!==undefined;
const number=supported?constantSignal:defaultNumber;
return {name,number,description,supported,action,forced,standard};
};

const getSignalsByName=function(){
const signals=getSignals();
return signals.reduce(getSignalByName,{});
};

const getSignalByName=function(
signalByNameMemo,
{name,number,description,supported,action,forced,standard})
{
return {
...signalByNameMemo,
[name]:{name,number,description,supported,action,forced,standard}};

};

const signalsByName=getSignalsByName();




const getSignalsByNumber=function(){
const signals=getSignals();
const length=SIGRTMAX+1;
const signalsA=Array.from({length},(value,number)=>
getSignalByNumber(number,signals));

return Object.assign({},...signalsA);
};

const getSignalByNumber=function(number,signals){
const signal=findSignalByNumber(number,signals);

if(signal===undefined){
return {};
}

const{name,description,supported,action,forced,standard}=signal;
return {
[number]:{
name,
number,
description,
supported,
action,
forced,
standard}};


};



const findSignalByNumber=function(number,signals){
const signal=signals.find(({name})=>os.constants.signals[name]===number);

if(signal!==undefined){
return signal;
}

return signals.find((signalA)=>signalA.number===number);
};

getSignalsByNumber();

const getErrorPrefix = ({timedOut, timeout, errorCode, signal, signalDescription, exitCode, isCanceled}) => {
	if (timedOut) {
		return `timed out after ${timeout} milliseconds`;
	}

	if (isCanceled) {
		return 'was canceled';
	}

	if (errorCode !== undefined) {
		return `failed with ${errorCode}`;
	}

	if (signal !== undefined) {
		return `was killed with ${signal} (${signalDescription})`;
	}

	if (exitCode !== undefined) {
		return `failed with exit code ${exitCode}`;
	}

	return 'failed';
};

const makeError = ({
	stdout,
	stderr,
	all,
	error,
	signal,
	exitCode,
	command,
	escapedCommand,
	timedOut,
	isCanceled,
	killed,
	parsed: {options: {timeout}},
}) => {
	// `signal` and `exitCode` emitted on `spawned.on('exit')` event can be `null`.
	// We normalize them to `undefined`
	exitCode = exitCode === null ? undefined : exitCode;
	signal = signal === null ? undefined : signal;
	const signalDescription = signal === undefined ? undefined : signalsByName[signal].description;

	const errorCode = error && error.code;

	const prefix = getErrorPrefix({timedOut, timeout, errorCode, signal, signalDescription, exitCode, isCanceled});
	const execaMessage = `Command ${prefix}: ${command}`;
	const isError = Object.prototype.toString.call(error) === '[object Error]';
	const shortMessage = isError ? `${execaMessage}\n${error.message}` : execaMessage;
	const message = [shortMessage, stderr, stdout].filter(Boolean).join('\n');

	if (isError) {
		error.originalMessage = error.message;
		error.message = message;
	} else {
		error = new Error(message);
	}

	error.shortMessage = shortMessage;
	error.command = command;
	error.escapedCommand = escapedCommand;
	error.exitCode = exitCode;
	error.signal = signal;
	error.signalDescription = signalDescription;
	error.stdout = stdout;
	error.stderr = stderr;

	if (all !== undefined) {
		error.all = all;
	}

	if ('bufferedData' in error) {
		delete error.bufferedData;
	}

	error.failed = true;
	error.timedOut = Boolean(timedOut);
	error.isCanceled = isCanceled;
	error.killed = killed && !timedOut;

	return error;
};

const aliases = ['stdin', 'stdout', 'stderr'];

const hasAlias = options => aliases.some(alias => options[alias] !== undefined);

const normalizeStdio = options => {
	if (!options) {
		return;
	}

	const {stdio} = options;

	if (stdio === undefined) {
		return aliases.map(alias => options[alias]);
	}

	if (hasAlias(options)) {
		throw new Error(`It's not possible to provide \`stdio\` in combination with one of ${aliases.map(alias => `\`${alias}\``).join(', ')}`);
	}

	if (typeof stdio === 'string') {
		return stdio;
	}

	if (!Array.isArray(stdio)) {
		throw new TypeError(`Expected \`stdio\` to be of type \`string\` or \`Array\`, got \`${typeof stdio}\``);
	}

	const length = Math.max(stdio.length, aliases.length);
	return Array.from({length}, (value, index) => stdio[index]);
};

var signalExit = {exports: {}};

var signals$1 = {exports: {}};

var hasRequiredSignals;

function requireSignals () {
	if (hasRequiredSignals) return signals$1.exports;
	hasRequiredSignals = 1;
	(function (module) {
		// This is not the set of all possible signals.
		//
		// It IS, however, the set of all signals that trigger
		// an exit on either Linux or BSD systems.  Linux is a
		// superset of the signal names supported on BSD, and
		// the unknown signals just fail to register, so we can
		// catch that easily enough.
		//
		// Don't bother with SIGKILL.  It's uncatchable, which
		// means that we can't fire any callbacks anyway.
		//
		// If a user does happen to register a handler on a non-
		// fatal signal like SIGWINCH or something, and then
		// exit, it'll end up firing `process.emit('exit')`, so
		// the handler will be fired anyway.
		//
		// SIGBUS, SIGFPE, SIGSEGV and SIGILL, when not raised
		// artificially, inherently leave the process in a
		// state from which it is not safe to try and enter JS
		// listeners.
		module.exports = [
		  'SIGABRT',
		  'SIGALRM',
		  'SIGHUP',
		  'SIGINT',
		  'SIGTERM'
		];

		if (process.platform !== 'win32') {
		  module.exports.push(
		    'SIGVTALRM',
		    'SIGXCPU',
		    'SIGXFSZ',
		    'SIGUSR2',
		    'SIGTRAP',
		    'SIGSYS',
		    'SIGQUIT',
		    'SIGIOT'
		    // should detect profiler and enable/disable accordingly.
		    // see #21
		    // 'SIGPROF'
		  );
		}

		if (process.platform === 'linux') {
		  module.exports.push(
		    'SIGIO',
		    'SIGPOLL',
		    'SIGPWR',
		    'SIGSTKFLT',
		    'SIGUNUSED'
		  );
		}
} (signals$1));
	return signals$1.exports;
}

// Note: since nyc uses this module to output coverage, any lines
// that are in the direct sync flow of nyc's outputCoverage are
// ignored, since we can never get coverage for them.
// grab a reference to node's real process object right away
var process$1 = commonjsGlobal.process;

const processOk = function (process) {
  return process &&
    typeof process === 'object' &&
    typeof process.removeListener === 'function' &&
    typeof process.emit === 'function' &&
    typeof process.reallyExit === 'function' &&
    typeof process.listeners === 'function' &&
    typeof process.kill === 'function' &&
    typeof process.pid === 'number' &&
    typeof process.on === 'function'
};

// some kind of non-node environment, just no-op
/* istanbul ignore if */
if (!processOk(process$1)) {
  signalExit.exports = function () {
    return function () {}
  };
} else {
  var assert = require$$0$3;
  var signals = requireSignals();
  var isWin = /^win/i.test(process$1.platform);

  var EE = require$$2;
  /* istanbul ignore if */
  if (typeof EE !== 'function') {
    EE = EE.EventEmitter;
  }

  var emitter;
  if (process$1.__signal_exit_emitter__) {
    emitter = process$1.__signal_exit_emitter__;
  } else {
    emitter = process$1.__signal_exit_emitter__ = new EE();
    emitter.count = 0;
    emitter.emitted = {};
  }

  // Because this emitter is a global, we have to check to see if a
  // previous version of this library failed to enable infinite listeners.
  // I know what you're about to say.  But literally everything about
  // signal-exit is a compromise with evil.  Get used to it.
  if (!emitter.infinite) {
    emitter.setMaxListeners(Infinity);
    emitter.infinite = true;
  }

  signalExit.exports = function (cb, opts) {
    /* istanbul ignore if */
    if (!processOk(commonjsGlobal.process)) {
      return function () {}
    }
    assert.equal(typeof cb, 'function', 'a callback must be provided for exit handler');

    if (loaded === false) {
      load();
    }

    var ev = 'exit';
    if (opts && opts.alwaysLast) {
      ev = 'afterexit';
    }

    var remove = function () {
      emitter.removeListener(ev, cb);
      if (emitter.listeners('exit').length === 0 &&
          emitter.listeners('afterexit').length === 0) {
        unload();
      }
    };
    emitter.on(ev, cb);

    return remove
  };

  var unload = function unload () {
    if (!loaded || !processOk(commonjsGlobal.process)) {
      return
    }
    loaded = false;

    signals.forEach(function (sig) {
      try {
        process$1.removeListener(sig, sigListeners[sig]);
      } catch (er) {}
    });
    process$1.emit = originalProcessEmit;
    process$1.reallyExit = originalProcessReallyExit;
    emitter.count -= 1;
  };
  signalExit.exports.unload = unload;

  var emit = function emit (event, code, signal) {
    /* istanbul ignore if */
    if (emitter.emitted[event]) {
      return
    }
    emitter.emitted[event] = true;
    emitter.emit(event, code, signal);
  };

  // { <signal>: <listener fn>, ... }
  var sigListeners = {};
  signals.forEach(function (sig) {
    sigListeners[sig] = function listener () {
      /* istanbul ignore if */
      if (!processOk(commonjsGlobal.process)) {
        return
      }
      // If there are no other listeners, an exit is coming!
      // Simplest way: remove us and then re-send the signal.
      // We know that this will kill the process, so we can
      // safely emit now.
      var listeners = process$1.listeners(sig);
      if (listeners.length === emitter.count) {
        unload();
        emit('exit', null, sig);
        /* istanbul ignore next */
        emit('afterexit', null, sig);
        /* istanbul ignore next */
        if (isWin && sig === 'SIGHUP') {
          // "SIGHUP" throws an `ENOSYS` error on Windows,
          // so use a supported signal instead
          sig = 'SIGINT';
        }
        /* istanbul ignore next */
        process$1.kill(process$1.pid, sig);
      }
    };
  });

  signalExit.exports.signals = function () {
    return signals
  };

  var loaded = false;

  var load = function load () {
    if (loaded || !processOk(commonjsGlobal.process)) {
      return
    }
    loaded = true;

    // This is the number of onSignalExit's that are in play.
    // It's important so that we can count the correct number of
    // listeners on signals, and don't wait for the other one to
    // handle it instead of us.
    emitter.count += 1;

    signals = signals.filter(function (sig) {
      try {
        process$1.on(sig, sigListeners[sig]);
        return true
      } catch (er) {
        return false
      }
    });

    process$1.emit = processEmit;
    process$1.reallyExit = processReallyExit;
  };
  signalExit.exports.load = load;

  var originalProcessReallyExit = process$1.reallyExit;
  var processReallyExit = function processReallyExit (code) {
    /* istanbul ignore if */
    if (!processOk(commonjsGlobal.process)) {
      return
    }
    process$1.exitCode = code || /* istanbul ignore next */ 0;
    emit('exit', process$1.exitCode, null);
    /* istanbul ignore next */
    emit('afterexit', process$1.exitCode, null);
    /* istanbul ignore next */
    originalProcessReallyExit.call(process$1, process$1.exitCode);
  };

  var originalProcessEmit = process$1.emit;
  var processEmit = function processEmit (ev, arg) {
    if (ev === 'exit' && processOk(commonjsGlobal.process)) {
      /* istanbul ignore else */
      if (arg !== undefined) {
        process$1.exitCode = arg;
      }
      var ret = originalProcessEmit.apply(this, arguments);
      /* istanbul ignore next */
      emit('exit', process$1.exitCode, null);
      /* istanbul ignore next */
      emit('afterexit', process$1.exitCode, null);
      /* istanbul ignore next */
      return ret
    } else {
      return originalProcessEmit.apply(this, arguments)
    }
  };
}

function isStream(stream) {
	return stream !== null
		&& typeof stream === 'object'
		&& typeof stream.pipe === 'function';
}

var getStream$1 = {exports: {}};

const {PassThrough: PassThroughStream} = require$$0$4;

var bufferStream$1 = options => {
	options = {...options};

	const {array} = options;
	let {encoding} = options;
	const isBuffer = encoding === 'buffer';
	let objectMode = false;

	if (array) {
		objectMode = !(encoding || isBuffer);
	} else {
		encoding = encoding || 'utf8';
	}

	if (isBuffer) {
		encoding = null;
	}

	const stream = new PassThroughStream({objectMode});

	if (encoding) {
		stream.setEncoding(encoding);
	}

	let length = 0;
	const chunks = [];

	stream.on('data', chunk => {
		chunks.push(chunk);

		if (objectMode) {
			length = chunks.length;
		} else {
			length += chunk.length;
		}
	});

	stream.getBufferedValue = () => {
		if (array) {
			return chunks;
		}

		return isBuffer ? Buffer.concat(chunks, length) : chunks.join('');
	};

	stream.getBufferedLength = () => length;

	return stream;
};

const {constants: BufferConstants} = require$$0$5;
const stream = require$$0$4;
const {promisify} = require$$2$1;
const bufferStream = bufferStream$1;

const streamPipelinePromisified = promisify(stream.pipeline);

class MaxBufferError extends Error {
	constructor() {
		super('maxBuffer exceeded');
		this.name = 'MaxBufferError';
	}
}

async function getStream(inputStream, options) {
	if (!inputStream) {
		throw new Error('Expected a stream');
	}

	options = {
		maxBuffer: Infinity,
		...options
	};

	const {maxBuffer} = options;
	const stream = bufferStream(options);

	await new Promise((resolve, reject) => {
		const rejectPromise = error => {
			// Don't retrieve an oversized buffer.
			if (error && stream.getBufferedLength() <= BufferConstants.MAX_LENGTH) {
				error.bufferedData = stream.getBufferedValue();
			}

			reject(error);
		};

		(async () => {
			try {
				await streamPipelinePromisified(inputStream, stream);
				resolve();
			} catch (error) {
				rejectPromise(error);
			}
		})();

		stream.on('data', () => {
			if (stream.getBufferedLength() > maxBuffer) {
				rejectPromise(new MaxBufferError());
			}
		});
	});

	return stream.getBufferedValue();
}

getStream$1.exports = getStream;
getStream$1.exports.buffer = (stream, options) => getStream(stream, {...options, encoding: 'buffer'});
getStream$1.exports.array = (stream, options) => getStream(stream, {...options, array: true});
getStream$1.exports.MaxBufferError = MaxBufferError;

const validateInputSync = ({input}) => {
	if (isStream(input)) {
		throw new TypeError('The `input` option cannot be a stream in sync mode');
	}
};

const nativePromisePrototype = (async () => {})().constructor.prototype;
['then', 'catch', 'finally'].map(property => [
	property,
	Reflect.getOwnPropertyDescriptor(nativePromisePrototype, property),
]);

const normalizeArgs = (file, args = []) => {
	if (!Array.isArray(args)) {
		return [file];
	}

	return [file, ...args];
};

const NO_ESCAPE_REGEXP = /^[\w.-]+$/;
const DOUBLE_QUOTES_REGEXP = /"/g;

const escapeArg = arg => {
	if (typeof arg !== 'string' || NO_ESCAPE_REGEXP.test(arg)) {
		return arg;
	}

	return `"${arg.replace(DOUBLE_QUOTES_REGEXP, '\\"')}"`;
};

const joinCommand = (file, args) => normalizeArgs(file, args).join(' ');

const getEscapedCommand = (file, args) => normalizeArgs(file, args).map(arg => escapeArg(arg)).join(' ');

const SPACES_REGEXP = / +/g;

// Handle `execaCommand()`
const parseCommand = command => {
	const tokens = [];
	for (const token of command.trim().split(SPACES_REGEXP)) {
		// Allow spaces to be escaped by a backslash if not meant as a delimiter
		const previousToken = tokens[tokens.length - 1];
		if (previousToken && previousToken.endsWith('\\')) {
			// Merge previous token with current one
			tokens[tokens.length - 1] = `${previousToken.slice(0, -1)} ${token}`;
		} else {
			tokens.push(token);
		}
	}

	return tokens;
};

const DEFAULT_MAX_BUFFER = 1000 * 1000 * 100;

const getEnv = ({env: envOption, extendEnv, preferLocal, localDir, execPath}) => {
	const env = extendEnv ? {...process$2.env, ...envOption} : envOption;

	if (preferLocal) {
		return npmRunPathEnv({env, cwd: localDir, execPath});
	}

	return env;
};

const handleArguments = (file, args, options = {}) => {
	const parsed = crossSpawn.exports._parse(file, args, options);
	file = parsed.command;
	args = parsed.args;
	options = parsed.options;

	options = {
		maxBuffer: DEFAULT_MAX_BUFFER,
		buffer: true,
		stripFinalNewline: true,
		extendEnv: true,
		preferLocal: false,
		localDir: options.cwd || process$2.cwd(),
		execPath: process$2.execPath,
		encoding: 'utf8',
		reject: true,
		cleanup: true,
		all: false,
		windowsHide: true,
		...options,
	};

	options.env = getEnv(options);

	options.stdio = normalizeStdio(options);

	if (process$2.platform === 'win32' && path$3.basename(file, '.exe') === 'cmd') {
		// #116
		args.unshift('/q');
	}

	return {file, args, options, parsed};
};

const handleOutput = (options, value, error) => {
	if (typeof value !== 'string' && !node_buffer.Buffer.isBuffer(value)) {
		// When `execaSync()` errors, we normalize it to '' to mimic `execa()`
		return error === undefined ? undefined : '';
	}

	if (options.stripFinalNewline) {
		return stripFinalNewline(value);
	}

	return value;
};

function execaSync(file, args, options) {
	const parsed = handleArguments(file, args, options);
	const command = joinCommand(file, args);
	const escapedCommand = getEscapedCommand(file, args);

	validateInputSync(parsed.options);

	let result;
	try {
		result = childProcess.spawnSync(parsed.file, parsed.args, parsed.options);
	} catch (error) {
		throw makeError({
			error,
			stdout: '',
			stderr: '',
			all: '',
			command,
			escapedCommand,
			parsed,
			timedOut: false,
			isCanceled: false,
			killed: false,
		});
	}

	const stdout = handleOutput(parsed.options, result.stdout, result.error);
	const stderr = handleOutput(parsed.options, result.stderr, result.error);

	if (result.error || result.status !== 0 || result.signal !== null) {
		const error = makeError({
			stdout,
			stderr,
			error: result.error,
			signal: result.signal,
			exitCode: result.status,
			command,
			escapedCommand,
			parsed,
			timedOut: result.error && result.error.code === 'ETIMEDOUT',
			isCanceled: false,
			killed: result.signal !== null,
		});

		if (!parsed.options.reject) {
			return error;
		}

		throw error;
	}

	return {
		command,
		escapedCommand,
		exitCode: 0,
		stdout,
		stderr,
		failed: false,
		timedOut: false,
		isCanceled: false,
		killed: false,
	};
}

function execaCommandSync(command, options) {
	const [file, ...args] = parseCommand(command);
	return execaSync(file, args, options);
}

function getCurrentGitBranch() {
    return execaCommandSync('git rev-parse --abbrev-ref HEAD').stdout;
}

function preCommit() {
    if (getCurrentGitBranch() === 'dev') {
        return;
    }
    try {
        execaCommandSync('pnpm exec lint-staged', { stdio: 'inherit' });
    }
    catch {
        process$2.exit(1);
    }
}
function prePush() {
    if (getCurrentGitBranch() === 'dev') {
        return;
    }
    try {
        execaCommandSync('pnpm exec typecheck', { stdio: 'inherit' });
    }
    catch {
        process$2.exit(1);
    }
}
function commitMsg() {
    const message = process$2.argv.at(-1);
    if (message === undefined) {
        throw new Error('No message provided.');
    }
    try {
        execaSync('pnpm', ['exec', 'commitlint', '--edit', message], {
            stdio: 'inherit',
        });
    }
    catch {
        process$2.exit(1);
    }
}

function rmDist() {
    if (!fs__namespace.existsSync('dist')) {
        return;
    }
    fs__namespace.rmSync('dist', { recursive: true, force: true });
}

Object.defineProperty(exports, 'chProjectDir', {
	enumerable: true,
	get: function () { return lionUtils.chProjectDir; }
});
Object.defineProperty(exports, 'getProjectDir', {
	enumerable: true,
	get: function () { return lionUtils.getProjectDir; }
});
Object.defineProperty(exports, 'updateJsonFile', {
	enumerable: true,
	get: function () { return lionUtils.updateJsonFile; }
});
exports.commitMsg = commitMsg;
exports.copyPackageFiles = copyPackageFiles;
exports.packageFiles = packageFiles;
exports.preCommit = preCommit;
exports.prePush = prePush;
exports.removePreinstallScript = removePreinstallScript;
exports.rewritePackageJsonPaths = rewritePackageJsonPaths;
exports.rmDist = rmDist;
exports.transformPackageJson = transformPackageJson;
