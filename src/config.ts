import createDebug from 'debug';
import {
  lilconfig,
  lilconfigSync,
  type Options as LilconfigOpts,
  type OptionsSync as LilconfigOptsSync,
  type LilconfigResult,
  type Loader,
} from 'lilconfig';
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
 * The result of a {@linkcode PreConfigTransform}
 */
export type PreConfigResult<Schema extends z.ZodTypeAny> = {
  filepath: string;
  config: z.input<Schema>;
  isEmpty?: boolean;
} | null;

/**
 * The result of a {@linkcode ConfigTransform}
 */
export type ConfigResult<Schema extends z.ZodTypeAny> = {
  filepath: string;
  config: z.output<Schema>;
  isEmpty?: boolean;
} | null;

/**
 * Transformer function that runs _before_ validation
 */
export type PreConfigTransform<
  Schema extends z.ZodTypeAny,
  Output extends PreConfigResult<Schema> = PreConfigResult<Schema>,
> = (result: LilconfigResult) => Promise<Output>;

/**
 * Synchronous transformer function that runs _before_ validation
 */
export type PreConfigTransformSync<
  Schema extends z.ZodTypeAny,
  Output extends PreConfigResult<Schema> = PreConfigResult<Schema>,
> = (result: LilconfigResult) => Output;

/**
 * Validation transform
 * @internal
 */
type ConfigTransform<
  Schema extends z.ZodTypeAny,
  Input extends PreConfigResult<Schema> = PreConfigResult<Schema>,
> = (result: Input) => Promise<ConfigResult<Schema>>;

/**
 * Synchronous validation transform
 */
type ConfigTransformSync<
  Schema extends z.ZodTypeAny,
  Input extends PreConfigResult<Schema> = PreConfigResult<Schema>,
> = (result: Input) => ConfigResult<Schema>;

/**
 * Transformer function that runs _after_ validation
 */
export type PostConfigTransform<
  Schema extends z.ZodTypeAny,
  Output extends ConfigResult<Schema> = ConfigResult<Schema>,
> = (result: ConfigResult<Schema>) => Promise<Output>;

/**
 * Synchronous transformer function that runs _after_ validation
 */
export type PostConfigTransformSync<
  Schema extends z.ZodTypeAny,
  Output extends ConfigResult<Schema> = ConfigResult<Schema>,
> = (result: ConfigResult<Schema>) => Output;

/**
 * Creates a {@linkcode ConfigTransform}
 * @param schema - Zod schema
 * @param opts - Options
 * @returns A {@linkcode ConfigTransform}
 */
function createZodTransformer<
  Schema extends z.ZodTypeAny,
  Input extends PreConfigResult<Schema> = PreConfigResult<Schema>,
>(
  schema: Schema,
  opts: CreateZodTransformerOpts = {},
): ConfigTransform<Schema, Input> {
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
 * Creates a synchronous {@linkcode ConfigTransform}
 * @param schema - Zod schema
 * @param opts - Options
 * @returns A synchronous {@linkcode ConfigTransform}
 */
function createZodTransformerSync<
  Schema extends z.ZodTypeAny,
  Input extends PreConfigResult<Schema> = PreConfigResult<Schema>,
>(
  schema: Schema,
  opts: CreateZodTransformerOpts = {},
): ConfigTransformSync<Schema, Input> {
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
interface BuildTransformOpts<
  Schema extends z.ZodTypeAny,
  PreConfigOutput extends PreConfigResult<Schema> = PreConfigResult<Schema>,
  PostConfigOutput extends ConfigResult<Schema> = ConfigResult<Schema>,
> {
  /**
   * @defaultValue false
   */
  safe?: boolean;
  pre?: PreConfigTransform<Schema, PreConfigOutput>;
  post?: PostConfigTransform<Schema, PostConfigOutput>;
}

/**
 * Options for {@linkcode buildTransformSync}
 * @internal
 */
interface BuildTransformSyncOpts<
  Schema extends z.ZodTypeAny,
  PreConfigOutput extends PreConfigResult<Schema> = PreConfigResult<Schema>,
  PostConfigOutput extends ConfigResult<Schema> = ConfigResult<Schema>,
> {
  /**
   * @defaultValue false
   */
  safe?: boolean;
  pre?: PreConfigTransformSync<Schema, PreConfigOutput>;
  post?: PostConfigTransformSync<Schema, PostConfigOutput>;
}

/**
 * Creates a transform which performs pre-validation, validation, and
 * post-validation transforms, returning the final result
 * @param schema - Zod schema
 * @param opts - Options
 * @returns Lilconfig transform
 * @internal
 */
function buildTransform<
  Schema extends z.ZodTypeAny,
  PreConfigOutput extends PreConfigResult<Schema> = PreConfigResult<Schema>,
  PostConfigOutput extends ConfigResult<Schema> = ConfigResult<Schema>,
>(
  schema: Schema,
  opts?: BuildTransformOpts<Schema, PreConfigOutput, PostConfigOutput>,
) {
  const {pre, post, safe} = opts ?? {};
  const transform = createZodTransformer<Schema, PreConfigOutput>(schema, {
    safe,
  });
  return async (lcResult: LilconfigResult): Promise<PostConfigOutput> => {
    if (lcResult !== null) {
      debug('(transform) Raw result: %O', lcResult);
    }
    const preResult = pre ? await pre(lcResult) : (lcResult as PreConfigOutput);
    const result = await transform(preResult);
    const postResult = post ? await post(result) : (result as PostConfigOutput);
    debug('(transform) Final result: %O', postResult);
    return postResult;
  };
}

/**
 * Creates a synchronous transform which performs pre-validation, validation, and
 * post-validation transforms, returning the final result
 * @param schema - Zod schema
 * @param opts - Options
 * @returns Synchronous Lilconfig transform
 * @internal
 */
function buildTransformSync<
  Schema extends z.ZodTypeAny,
  PreConfigOutput extends PreConfigResult<Schema> = PreConfigResult<Schema>,
  PostConfigOutput extends ConfigResult<Schema> = ConfigResult<Schema>,
>(
  schema: Schema,
  opts?: BuildTransformSyncOpts<Schema, PreConfigOutput, PostConfigOutput>,
) {
  const {pre, post, safe} = opts ?? {};
  const transform = createZodTransformerSync(schema, {safe});
  return (lcResult: LilconfigResult): PostConfigOutput => {
    debug('(transform) Raw result: %O', lcResult);
    const preResult = pre ? pre(lcResult) : (lcResult as PreConfigOutput);
    const result = transform(preResult);
    const postResult = post ? post(result) : (result as PostConfigOutput);
    return postResult;
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
   * @defaultValue true
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
 * All `loaders`, `pre` and `post` can be synchronous or asynchronous, but the latter is preferred.
 */
export interface ConfigOptsAsync<
  Schema extends z.ZodTypeAny,
  PreConfigOutput extends PreConfigResult<Schema> = PreConfigResult<Schema>,
  PostConfigOutput extends ConfigResult<Schema> = ConfigResult<Schema>,
> extends BaseConfigOpts {
  /**
   * Transform to run _before_ validation
   */
  pre?: PreConfigTransform<Schema, PreConfigOutput>;
  /**
   * Transform to run _after_ validation
   */
  post?: PostConfigTransform<Schema, PostConfigOutput>;

  /**
   * Custom Lilconfig loaders
   *
   * Keys are file extensions, values are functions which receive a filepath and
   * return (or resolve with) an object
   */
  loaders?: Record<string, (filepath: string) => Promise<unknown>>;
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
 * All `loaders`, `pre` and `post` _must_ be synchronous.
 */
export interface ConfigOptsSync<
  Schema extends z.ZodTypeAny,
  PreConfigOutput extends PreConfigResult<Schema> = PreConfigResult<Schema>,
  PostConfigOutput extends ConfigResult<Schema> = ConfigResult<Schema>,
> extends BaseConfigOpts {
  /**
   * Synchronous transform to run _before_ validation
   */
  pre?: PreConfigTransformSync<Schema, PreConfigOutput>;
  /**
   * Synchronous transform to run _after_ validation
   */
  post?: PostConfigTransformSync<Schema, PostConfigOutput>;

  /**
   * Custom synchronous Lilconfig loaders
   *
   * Keys are file extensions, values are functions which receive a filepath and
   * return an object.
   */
  loaders?: Record<string, (filepath: string) => unknown>;
}

const DEFAULT_LOADERS = {'.mjs': loadEsm, '.js': loadEsm} as const;
const DEFAULT_LOADERS_SYNC = {} as const;

/**
 * Builds options for Lilconfig
 * @param schema - Zod schema
 * @param opts - Options
 * @returns Lilconfig options
 * @internal
 */
function applyDefaults<
  Schema extends z.ZodTypeAny,
  PreConfigOutput extends PreConfigResult<Schema> = PreConfigResult<Schema>,
  PostConfigOutput extends ConfigResult<Schema> = ConfigResult<Schema>,
>(
  schema: Schema,
  opts?: ConfigOptsAsync<Schema, PreConfigOutput, PostConfigOutput>,
): LilconfigOpts | LilconfigOptsSync {
  const {loaders, searchPlaces, pre, post, safe} = opts ?? {};
  const transform = buildTransform(schema, {
    pre,
    post,
    safe,
  });
  const lcOpts: LilconfigOpts = {
    loaders: {...DEFAULT_LOADERS, ...loaders},
    transform,
  };
  if (searchPlaces?.length) {
    lcOpts.searchPlaces = searchPlaces;
  }

  return lcOpts;
}

/**
 * Builds options for Lilconfig in sync mode
 * @param schema - Zod schema
 * @param opts - Options
 * @returns Lilconfig options
 * @internal
 */
function applyDefaultsSync<
  Schema extends z.ZodTypeAny,
  PreConfigOutput extends PreConfigResult<Schema> = PreConfigResult<Schema>,
  PostConfigOutput extends ConfigResult<Schema> = ConfigResult<Schema>,
>(
  schema: Schema,
  opts?: ConfigOptsSync<Schema, PreConfigOutput, PostConfigOutput>,
) {
  const {loaders, searchPlaces, pre, post, safe} = opts ?? {};
  const transform = buildTransformSync(schema, {pre, post, safe});
  const lcOpts: LilconfigOptsSync = {
    loaders: {...DEFAULT_LOADERS_SYNC, ...loaders},
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
 * @param programName - Name of your program; this name is generally present in the config filename
 * @param schema - Zod schema
 * @param opts - Options
 * @returns A typed, validated (and optionally transformed) configuration object
 */
export async function searchConfig<
  Schema extends z.ZodTypeAny,
  PreConfigOutput extends PreConfigResult<Schema> = PreConfigResult<Schema>,
  PostConfigOutput extends ConfigResult<Schema> = ConfigResult<Schema>,
>(
  programName: string,
  schema: Schema,
  opts?: ConfigOptsAsync<Schema, PreConfigOutput, PostConfigOutput> &
    SearchOpts,
) {
  const cache = Boolean(opts?.cache ?? true);
  const lc = lilconfig(programName, applyDefaults(schema, opts));
  const result = (await lc.search(opts?.cwd)) as PostConfigOutput;
  if (cache && result !== null) {
    configCache.set(result.filepath, result);
  }
  return result;
}

/**
 * Synchronously search for a config file, load it if found, validate and optionally transform it.
 * @param programName - Name of your program; this name is generally present in the config filename
 * @param schema - Zod schema
 * @param opts - Options
 * @returns A typed, validated (and optionally transformed) configuration object
 */
export function searchConfigSync<
  Schema extends z.ZodTypeAny,
  PreConfigOutput extends PreConfigResult<Schema> = PreConfigResult<Schema>,
  PostConfigOutput extends ConfigResult<Schema> = ConfigResult<Schema>,
>(
  programName: string,
  schema: Schema,
  opts?: ConfigOptsSync<Schema, PreConfigOutput, PostConfigOutput> & SearchOpts,
) {
  const cache = Boolean(opts?.cache ?? true);
  const lc = lilconfigSync(programName, applyDefaultsSync(schema, opts));
  const result = lc.search(opts?.cwd) as PostConfigOutput;
  if (cache && result !== null) {
    configCache.set(result.filepath, result);
  }
  return result;
}

/**
 * Load a config file at path `filepath`
 * @param programName - Name of your program; this name is generally present in the config filename
 * @param filepath - Path to config file
 * @param schema - Zod schema
 * @param opts - Options
 * @returns A typed, validated (and optionally transformed) configuration object
 */
export async function loadConfig<
  Schema extends z.ZodTypeAny,
  PreConfigOutput extends PreConfigResult<Schema> = PreConfigResult<Schema>,
  PostConfigOutput extends ConfigResult<Schema> = ConfigResult<Schema>,
>(
  programName: string,
  filepath: string,
  schema: Schema,
  opts?: ConfigOptsAsync<Schema, PreConfigOutput, PostConfigOutput>,
): Promise<PostConfigOutput> {
  const cache = Boolean(opts?.cache ?? true);
  if (configCache.has(filepath)) {
    return configCache.get(filepath) as PostConfigOutput;
  }
  const lc = lilconfig(programName, applyDefaults(schema, opts));
  const result = (await lc.load(filepath)) as PostConfigOutput;
  if (cache && result !== null) {
    // result.filepath should be the same as filepath
    configCache.set(result.filepath, result);
  }
  return result;
}

/**
 * Synchronously load a config file at path `filepath`
 * @param programName - Name of your program; this name is generally present in the config filename
 * @param filepath - Path to config file
 * @param schema - Zod schema
 * @param opts - Options
 * @returns A typed, validated (and optionally transformed) configuration object
 */
export function loadConfigSync<
  Schema extends z.ZodTypeAny,
  PreConfigOutput extends PreConfigResult<Schema> = PreConfigResult<Schema>,
  PostConfigOutput extends ConfigResult<Schema> = ConfigResult<Schema>,
>(
  programName: string,
  filepath: string,
  schema: Schema,
  opts?: ConfigOptsSync<Schema, PreConfigOutput, PostConfigOutput>,
): PostConfigOutput {
  const cache = Boolean(opts?.cache ?? true);
  if (configCache.has(filepath)) {
    return configCache.get(filepath) as PostConfigOutput;
  }
  const lc = lilconfigSync(programName, applyDefaultsSync(schema, opts));
  const result = lc.load(filepath) as PostConfigOutput;
  if (cache && result !== null) {
    // result.filepath should be the same as filepath
    configCache.set(result.filepath, result);
  }
  debug('Config result: %O', result);
  return result;
}
