import type * as y from 'yargs';
import {hideBin} from 'yargs/helpers';
import yargs from 'yargs/yargs';
import z from 'zod';
import {ConfigOpts, ConfigOptsSync, getConfig, getConfigSync} from '../config';
import {configureYargs} from './configure';

export interface BaseOdlawOptions<Y = {}> {
  scriptName?: string;
  argv?: y.Argv<Y>;
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

function getScriptNameFromYargs<Y = {}>(argv?: y.Argv<Y>): string | undefined {
  if (argv && Reflect.get(argv, 'customScriptName')) {
    const scriptName = Reflect.get(argv, '$0') as string;
    if (scriptName) {
      return scriptName;
    }
  }
}
export function parseOdlawParams<
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
  const argv = opts.argv ?? (yargs() as y.Argv<Y>);

  return {scriptName, schema, opts, argv, args};
}

export async function odlaw<Schema extends z.AnyZodObject, Y = {}>(
  scriptNameOrSchema: string | Schema,
  schemaOrOpts?: Schema | OdlawOptions<Schema, Y>,
  options?: OdlawOptions<Schema, Y>,
) {
  const {
    scriptName,
    schema,
    opts,
    argv,
    args: rawArgs,
  } = parseOdlawParams(scriptNameOrSchema, schemaOrOpts, options);

  const argvWithSchema = configureYargs(argv, schema, {scriptName});
  const configResult = await getConfig(scriptName, schema, opts?.configOpts);
  const argvWithConfig = configResult
    ? argvWithSchema.config(configResult.config)
    : argvWithSchema;

  return argvWithConfig.parseAsync(rawArgs);
}

export function odlawSync<Schema extends z.AnyZodObject, Y = {}>(
  scriptNameOrSchema: string | Schema,
  schemaOrOpts?: Schema | OdlawSyncOptions<Schema, Y>,
  options?: OdlawSyncOptions<Schema, Y>,
) {
  const {
    scriptName,
    schema,
    opts,
    argv,
    args: rawArgs,
  } = parseOdlawParams(scriptNameOrSchema, schemaOrOpts, options);

  const argvWithSchema = configureYargs(argv, schema, {scriptName});
  const configResult = getConfigSync(scriptName, schema, opts?.configOpts);
  const argvWithConfig = configResult
    ? argvWithSchema.config(configResult.config)
    : argvWithSchema;

  return argvWithConfig
    .middleware((args) => {
      Object.assign(args, schema.passthrough().parse(args));
    }, true)
    .parseSync(rawArgs);
}
