import createDebug from 'debug';
import {
  lilconfig,
  lilconfigSync,
  type Options as LilconfigOpts,
  type OptionsSync as LilconfigOptsSync,
  type LilconfigResult,
  type Loader,
} from 'lilconfig';
import {isPromise} from 'util/types';
import {z} from 'zod';

const debug = createDebug('odlaw:config');

/**
 * ESM config loader; only works if using {@linkcode searchConfig} or {@linkcode loadConfig}
 * @param filepath Path to module or script
 * @returns Module
 */
const loadEsm: Loader = async (filepath: string) => import(filepath);

/**
 * @internal
 */
interface CreateZodTransformerOpts {
  /**
   * @defaultValue false
   */
  safe?: boolean;
}

/**
 * The result of a {@linkcode PrepareTransform}
 */
export type PreparedResult<Schema extends z.AnyZodObject> = {
  filepath: string;
  config: Schema['_input'];
  isEmpty?: boolean;
} | null;

/**
 * The result of a {@linkcode ValidatorTransform}
 */
export type ValidatedResult<Schema extends z.AnyZodObject> = {
  filepath: string;
  config: Schema['_output'];
  isEmpty?: boolean;
} | null;

/**
 * Transformer function that runs _before_ validation
 */
export type PrepareTransform<Schema extends z.AnyZodObject> = (
  rawResult: LilconfigResult,
) => PreparedResult<Schema> | Promise<PreparedResult<Schema>>;

/**
 * Synchronous transformer function that runs _before_ validation
 */
export type PrepareTransformSync<Schema extends z.AnyZodObject> = (
  rawResult: LilconfigResult,
) => PreparedResult<Schema>;

/**
 * Validation transform
 * @internal
 */
export type ValidatorTransform<Schema extends z.AnyZodObject> = (
  preResult: PreparedResult<Schema>,
) => Promise<ValidatedResult<Schema>>;

/**
 * Synchronous validation transform
 * @internal
 */
type ValidatorTransformSync<Schema extends z.AnyZodObject> = (
  preResult: PreparedResult<Schema>,
) => ValidatedResult<Schema>;

/**
 * Creates a {@linkcode ValidatorTransform}
 * @param schema - Zod schema
 * @param opts - Options
 * @returns A {@linkcode ValidatorTransform}
 */
function createValidatorTransform<Schema extends z.AnyZodObject>(
  schema: Schema,
  opts: CreateZodTransformerOpts = {},
): ValidatorTransform<Schema> {
  return async (result) => {
    if (result === null) {
      debug('(transform) No config loaded');
      return result;
    }
    if (opts.safe) {
      const parsed = await schema.safeParseAsync(result.config);
      debug('(transform) Safe validation result: %O', parsed);
      return parsed.success
        ? {...result, config: parsed.data}
        : {...result, error: parsed.error};
    }
    const parsed = await schema.parseAsync(result.config);
    debug('(transform) Validation result: %O', parsed);
    return {...result, config: parsed};
  };
}

/**
 * Creates a synchronous {@linkcode ValidatorTransform}
 * @param schema - Zod schema
 * @param opts - Options
 * @returns A synchronous {@linkcode ValidatorTransform}
 */
function createValidatorTransformSync<Schema extends z.AnyZodObject>(
  schema: Schema,
  opts: CreateZodTransformerOpts = {},
): ValidatorTransformSync<Schema> {
  return (result) => {
    if (result === null) {
      debug('(transform) No config loaded');
      return result;
    }
    if (opts.safe) {
      const parsed = schema.safeParse(result.config);
      debug('(transform) Safe parse result: %O', parsed);
      return parsed.success
        ? {...result, config: parsed.data}
        : {...result, error: parsed.error};
    }
    const parsed = schema.parse(result.config);
    debug('(transform) Parse result: %O', parsed);
    return {...result, config: parsed};
  };
}

/**
 * Options for {@linkcode buildTransform}
 * @internal
 */
interface BuildTransformOpts<Schema extends z.AnyZodObject> {
  /**
   * @defaultValue false
   */
  safe?: boolean;
  prepare?: PrepareTransform<Schema>;
}

/**
 * Options for {@linkcode buildTransformSync}
 * @internal
 */
interface BuildTransformSyncOpts<Schema extends z.AnyZodObject> {
  /**
   * @defaultValue false
   */
  safe?: boolean;
  prepare?: PrepareTransformSync<Schema>;
}

/**
 * Creates a transform which performs prepare-validation and validation transforms, returning the final result
 * @param schema - Zod schema
 * @param opts - Options
 * @returns Lilconfig transform
 * @internal
 */
function buildTransform<Schema extends z.AnyZodObject>(
  schema: Schema,
  opts?: BuildTransformOpts<Schema>,
) {
  const {prepare, safe} = opts ?? {};
  const transform = createValidatorTransform(schema, {
    safe,
  });
  return async (
    lcResult: LilconfigResult,
  ): Promise<ValidatedResult<Schema>> => {
    if (lcResult !== null) {
      debug('(transform) Raw result: %O', lcResult);
    }
    const preResult = prepare ? await prepare(lcResult) : lcResult;
    const result = await transform(preResult);
    debug('(transform) Final result: %O', result);
    return result;
  };
}

/**
 * Best-effort detection of an asynchronous function.
 *
 * Not foolproof; only works for functions created with the `async` keyword
 * @param fn Function to test
 * @returns Whether or not the function is async\
 * @internal
 */
function isAsyncFunction(fn: unknown): fn is (...args: any[]) => Promise<any> {
  return (
    typeof fn === 'function' &&
    (fn.constructor.name === 'AsyncFunction' ||
      Object.prototype.toString.call(fn) === '[object AsyncFunction]')
  );
}

/**
 * Creates a synchronous transform which performs pre-validation, validation, and
 * post-validation transforms, returning the final result
 * @param schema - Zod schema
 * @param opts - Options
 * @returns Synchronous Lilconfig transform
 * @internal
 */
function buildTransformSync<Schema extends z.AnyZodObject>(
  schema: Schema,
  opts?: BuildTransformSyncOpts<Schema>,
) {
  const {prepare, safe} = opts ?? {};
  const transform = createValidatorTransformSync(schema, {safe});
  return (lcResult: LilconfigResult): ValidatedResult<Schema> => {
    if (lcResult !== null) {
      debug('(transform) Raw result: %O', lcResult);
    }
    if (isPromise(lcResult?.config)) {
      throw new TypeError(
        `Loader for ${
          lcResult!.filepath
        } returned a Promise in synchronous mode; check your loaders`,
      );
    }

    const preResult = prepare ? prepare(lcResult) : lcResult;
    if (isPromise(preResult)) {
      throw new TypeError(
        'Asynchronous "prepare" transform found where synchronous transform expected',
      );
    }

    return transform(preResult);
  };
}

/**
 * Base options for {@linkcode searchConfig}, {@linkcode searchConfigSync},
 * {@linkcode loadConfig}, and {@linkcode loadConfigSync}
 */
export interface BaseConfigOpts {
  /**
   * Filenames to search for config files in.
   *
   * Does not support `.yaml/.yml`; if this is needed, provide a loader.
   *
   * `.mjs` is unsupported if using {@linkcode searchConfigSync} or {@linkcode loadConfigSync}.
   *
   * @see {@link https://github.com/antonk52/lilconfig/blob/master/readme.md} for how to add a YAML loader
   * @see {@link https://github.com/cosmiconfig/cosmiconfig/blob/main/README.md} for defaults
   */
  searchPlaces?: string[];
  /**
   * Whether or not to cache config results
   * @defaultValue false
   */
  cache?: boolean;

  /**
   * Whether or not to run Zod in "safe" mode
   * @defaultValue false
   */
  safe?: boolean;
}

/**
 * Options for {@linkcode searchConfig} and {@linkcode loadConfig}.
 *
 * All `loaders` and `prepare` can be synchronous or asynchronous, but the latter is preferred.
 */
export interface ConfigOpts<Schema extends z.AnyZodObject>
  extends BaseConfigOpts {
  /**
   * Transform to run _before_ validation
   */
  prepare?: PrepareTransform<Schema>;

  /**
   * Custom Lilconfig loaders
   *
   * Keys are file extensions, values are functions which receive a filepath and
   * return (or resolve with) an object
   */
  loaders?: Record<string, (filepath: string) => unknown | Promise<unknown>>;
}

/**
 * Additional options for {@linkcode searchConfig} and {@linkcode searchConfigSync}
 */
export interface SearchOpts {
  /**
   * Directory to start searching from
   */
  cwd?: string;
}

/**
 * Options for {@linkcode searchConfigSync} and {@linkcode loadConfigSync}.
 *
 * All `loaders` and `prepare` _must_ be synchronous.
 */
export interface ConfigOptsSync<Schema extends z.AnyZodObject>
  extends BaseConfigOpts {
  /**
   * Synchronous transform to run _before_ validation
   */
  prepare?: PrepareTransformSync<Schema>;

  /**
   * Custom synchronous Lilconfig loaders
   *
   * Keys are file extensions, values are functions which receive a filepath and
   * return an object.
   *
   * **Warning**: There's no way to guarantee the the loader is actually synchronous until we run it.
   */
  loaders?: Record<string, (filepath: string) => unknown>;
}

export type ConfigPathOpts = {
  path?: string;
};

export type GetConfigOpts<Schema extends z.AnyZodObject> = ConfigOpts<Schema> &
  ConfigPathOpts;

export type GetConfigOptsSync<Schema extends z.AnyZodObject> =
  ConfigOptsSync<Schema> & ConfigPathOpts;

const DEFAULT_LOADERS = {'.mjs': loadEsm, '.js': loadEsm} as const;
const DEFAULT_LOADERS_SYNC = {} as const;

/**
 * Builds options for Lilconfig
 * @param schema - Zod schema
 * @param opts - Options
 * @returns Lilconfig options
 * @internal
 */
function buildOptions<Schema extends z.AnyZodObject>(
  schema: Schema,
  opts?: ConfigOpts<Schema>,
): LilconfigOpts | LilconfigOptsSync {
  const {loaders, searchPlaces, prepare, safe} = opts ?? {};
  const transform = buildTransform(schema, {
    prepare,
    safe,
  });
  const lcOpts: LilconfigOpts = {
    loaders: {...DEFAULT_LOADERS, ...loaders},
    transform,
  };
  if (searchPlaces?.length) {
    lcOpts.searchPlaces = searchPlaces;
  }
  debug('Final lilconfig opts: %O', lcOpts);

  return lcOpts;
}

/**
 * Builds options for Lilconfig in sync mode
 * @param schema - Zod schema
 * @param opts - Options
 * @returns Lilconfig options
 * @internal
 */
function buildOptionsSync<Schema extends z.AnyZodObject>(
  schema: Schema,
  opts?: ConfigOptsSync<Schema>,
) {
  const {loaders: userLoaders, searchPlaces, prepare, safe} = opts ?? {};
  const transform = buildTransformSync(schema, {prepare, safe});
  const loaders = {...DEFAULT_LOADERS_SYNC, ...userLoaders};
  for (const [ext, loader] of Object.entries(loaders)) {
    if (isAsyncFunction(loader)) {
      throw new TypeError(
        `Asynchronous loader for ${ext} found where synchronous loader expected`,
      );
    }
  }
  const lcOpts: LilconfigOptsSync = {
    loaders,
    transform,
  };
  if (searchPlaces?.length) {
    lcOpts.searchPlaces = searchPlaces;
  }
  return lcOpts;
}

const configCache = new Map<string, unknown>();

/**
 * Resets the config cache
 */
export function resetCache() {
  configCache.clear();
}

/**
 * Search for a config file, load it if found, validate and optionally transform it.
 * @param scriptName - Name of your program; this name is generally present in the config filename
 * @param schema - Zod schema
 * @param opts - Options
 * @returns A typed, validated (and optionally transformed) configuration object
 */
export async function searchConfig<Schema extends z.AnyZodObject>(
  scriptName: string,
  schema: Schema,
  opts?: ConfigOpts<Schema> & SearchOpts,
) {
  const cache = Boolean(opts?.cache);
  const lc = lilconfig(scriptName, buildOptions(schema, opts));
  const result = (await lc.search(opts?.cwd)) as ValidatedResult<Schema>;
  if (cache && result !== null) {
    configCache.set(result.filepath, result);
  }
  return result;
}

/**
 * Synchronously search for a config file, load it if found, validate and optionally transform it.
 * @param scriptName - Name of your program; this name is generally present in the config filename
 * @param schema - Zod schema
 * @param opts - Options
 * @returns A typed, validated (and optionally transformed) configuration object
 */
export function searchConfigSync<Schema extends z.AnyZodObject>(
  scriptName: string,
  schema: Schema,
  opts?: ConfigOptsSync<Schema> & SearchOpts,
) {
  const cache = Boolean(opts?.cache ?? true);
  const lc = lilconfigSync(scriptName, buildOptionsSync(schema, opts));
  const result = lc.search(opts?.cwd) as ValidatedResult<Schema>;
  if (cache && result !== null) {
    configCache.set(result.filepath, result);
  }
  return result;
}

/**
 * Load a config file at path `filepath`
 * @param scriptName - Name of your program; this name is generally present in the config filename
 * @param filepath - Path to config file
 * @param schema - Zod schema
 * @param opts - Options
 * @returns A typed, validated (and optionally transformed) configuration object
 */
export async function loadConfig<Schema extends z.AnyZodObject>(
  scriptName: string,
  filepath: string,
  schema: Schema,
  opts?: ConfigOpts<Schema>,
): Promise<ValidatedResult<Schema>> {
  const useCache = Boolean(opts?.cache);
  if (useCache && configCache.has(filepath)) {
    return configCache.get(filepath) as ValidatedResult<Schema>;
  }
  const lc = lilconfig(scriptName, buildOptions(schema, opts));
  const result = (await lc.load(filepath)) as ValidatedResult<Schema>;
  if (useCache && result !== null) {
    // result.filepath should be the same as filepath
    configCache.set(result.filepath, result);
  }
  return result;
}

/**
 * Synchronously load a config file at path `filepath`
 * @param scriptName - Name of your program; this name is generally present in the config filename
 * @param filepath - Path to config file
 * @param schema - Zod schema
 * @param opts - Options
 * @returns A typed, validated (and optionally transformed) configuration object
 */
export function loadConfigSync<Schema extends z.AnyZodObject>(
  scriptName: string,
  filepath: string,
  schema: Schema,
  opts?: ConfigOptsSync<Schema>,
): ValidatedResult<Schema> {
  const useCache = Boolean(opts?.cache);
  if (useCache && configCache.has(filepath)) {
    return configCache.get(filepath) as ValidatedResult<Schema>;
  }
  const lc = lilconfigSync(scriptName, buildOptionsSync(schema, opts));
  const result = lc.load(filepath) as ValidatedResult<Schema>;
  if (useCache && result !== null) {
    // result.filepath should be the same as filepath
    configCache.set(result.filepath, result);
  }
  debug('Config result: %O', result);
  return result;
}

export async function getConfig<Schema extends z.AnyZodObject>(
  scriptName: string,
  schema: Schema,
  opts: GetConfigOpts<Schema> = {},
) {
  const {path: filepath, ...configOpts} = opts;
  return filepath
    ? loadConfig(scriptName, filepath, schema, configOpts)
    : searchConfig(scriptName, schema, configOpts);
}

export function getConfigSync<Schema extends z.AnyZodObject>(
  scriptName: string,
  schema: Schema,
  opts: GetConfigOptsSync<Schema> = {},
) {
  const {path: filepath, ...configOpts} = opts;
  return filepath
    ? loadConfigSync(scriptName, filepath, schema, configOpts)
    : searchConfigSync(scriptName, schema, configOpts);
}
