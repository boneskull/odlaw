/* eslint-disable @typescript-eslint/ban-types */
import type * as y from 'yargs';
import type {Argv} from 'yargs';
import {hideBin} from 'yargs/helpers';
import yargs from 'yargs/yargs';
import z from 'zod';
import {
  getConfig,
  getConfigSync,
  type ConfigOpts,
  type ConfigOptsSync,
} from '../config';

export interface BaseOdlawOptions<Y = {}> {
  scriptName?: string;
  argv?: Argv<Y>;
  args?: string[];
}

export interface OdlawSyncOptions<Schema extends z.AnyZodObject, Y = {}>
  extends BaseOdlawOptions<Y> {
  configOpts?: ConfigOptsSync<Schema>;
}

export interface OdlawOptions<Schema extends z.AnyZodObject, Y = {}>
  extends BaseOdlawOptions<Y> {
  configOpts?: ConfigOpts<Schema>;
}

export interface ConfigureYargsOptions {
  scriptName?: string;
}

/**
 * @internal
 * @param argv Yargs instance
 * @param schema Zod schema
 * @param opts Options
 * @returns Yargs instance configured with Zod schema and optionally `scriptName`
 */
export function configureYargs<T extends z.AnyZodObject, U>(
  argv: Argv<U>,
  schema: T,
  opts: ConfigureYargsOptions = {},
) {
  if (!(schema instanceof z.ZodObject)) {
    throw new TypeError('Expected schema to be a ZodObject');
  }
  if (opts.scriptName) {
    argv = argv.scriptName(opts.scriptName);
  }

  return argv.options(schema._toYargsOptionsRecord());
}

function getScriptNameFromYargs<Y = {}>(argv?: Argv<Y>): string | undefined {
  if (argv && Reflect.get(argv, 'customScriptName')) {
    const scriptName = Reflect.get(argv, '$0') as string;
    if (scriptName) {
      return scriptName;
    }
  }
}

function parseOdlawParams<
  Schema extends z.AnyZodObject,
  Opts extends OdlawOptions<Schema, Y> | OdlawSyncOptions<Schema, Y>,
  Y = {},
>(
  scriptNameOrSchema: string | Schema,
  schemaOrOpts?: Schema | Opts,
  opts?: Opts,
) {
  let scriptName: string;
  let schema: Schema;

  if (typeof scriptNameOrSchema === 'string') {
    scriptName = scriptNameOrSchema;
    schema = schemaOrOpts as Schema;
    opts = {} as Opts;
  } else {
    schema = scriptNameOrSchema;
    opts = (schemaOrOpts ?? {}) as Opts;
    scriptName = opts.scriptName ?? (getScriptNameFromYargs(opts.argv) as any);
    if (!scriptName) {
      throw new TypeError('Expected scriptName to be defined');
    }
  }

  const args = opts.args ?? hideBin(process.argv);
  const argv = opts.argv ?? (yargs() as Argv<Y>);

  return {scriptName, schema, opts, argv, args};
}

export async function odlaw<Schema extends z.AnyZodObject, Y = {}>(
  scriptNameOrSchema: string | Schema,
  schemaOrOpts?: Schema | OdlawOptions<Schema, Y>,
  options?: OdlawOptions<Schema, Y>,
) {
  const {scriptName, schema, opts, argv, args} = parseOdlawParams(
    scriptNameOrSchema,
    schemaOrOpts,
    options,
  );

  const argvWithSchema = configureYargs(argv, schema, {scriptName});
  const configResult = await getConfig(scriptName, schema, opts?.configOpts);
  const argvWithConfig = configResult
    ? argvWithSchema.config(configResult.config)
    : argvWithSchema;

  return argvWithConfig.parseAsync(args);
}
export type ParsedArgs<T> = {
  [key in keyof y.Arguments<T> as
    | key
    | y.CamelCaseKey<key>]: y.Arguments<T>[key];
};
export function odlawSync<Schema extends z.AnyZodObject, Y = {}>(
  scriptNameOrSchema: string | Schema,
  schemaOrOpts?: Schema | OdlawSyncOptions<Schema, Y>,
  options?: OdlawSyncOptions<Schema, Y>,
) {
  const {scriptName, schema, opts, argv, args} = parseOdlawParams(
    scriptNameOrSchema,
    schemaOrOpts,
    options,
  );

  const argvWithSchema = configureYargs(argv, schema, {scriptName});
  const configResult = getConfigSync(scriptName, schema, opts?.configOpts);
  const argvWithConfig = configResult
    ? argvWithSchema.config(configResult.config)
    : argvWithSchema;

  return argvWithConfig
    .middleware((args) => schema.parse(args))
    .parseSync(args);
}
