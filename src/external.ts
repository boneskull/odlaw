import yargs from 'yargs/yargs';
import z from 'zod';
import {configureYargs} from './args';
import {
  ConfigOptsAsync,
  ConfigOptsSync,
  ValidatedResult,
  loadConfig,
  loadConfigSync,
  searchConfig,
  searchConfigSync,
} from './config';

export {
  loadConfig,
  loadConfigSync,
  searchConfig,
  searchConfigSync,
} from './config';

export interface BaseOdlawOptions {
  configFilepath?: string;
}

export interface OdlawSyncOptions<Schema extends z.AnyZodObject>
  extends BaseOdlawOptions {
  configOpts?: ConfigOptsSync<Schema>;
}

export interface OdlawOptions<Schema extends z.AnyZodObject>
  extends BaseOdlawOptions {
  configOpts?: ConfigOptsAsync<Schema>;
}

export async function odlaw<Schema extends z.AnyZodObject>(
  programName: string,
  schema: Schema,
  opts: OdlawOptions<Schema> = {},
) {
  let configResult: ValidatedResult<Schema>;
  if (opts.configFilepath) {
    configResult = await loadConfig(
      programName,
      opts.configFilepath,
      schema,
      opts.configOpts,
    );
  } else {
    configResult = await searchConfig(programName, schema, opts.configOpts);
  }

  const argv = configureYargs(yargs(), schema);
  if (configResult) {
    argv.config(configResult);
  }
  return argv.parseAsync();
}

export function odlawSync<Schema extends z.AnyZodObject>(
  programName: string,
  schema: Schema,
  opts: OdlawSyncOptions<Schema> = {},
) {
  let configResult: ValidatedResult<Schema>;
  if (opts.configFilepath) {
    configResult = loadConfigSync(
      programName,
      opts.configFilepath,
      schema,
      opts.configOpts,
    );
  } else {
    configResult = searchConfigSync(programName, schema, opts.configOpts);
  }

  const argv = configureYargs(yargs(), schema);
  if (configResult) {
    argv.config(configResult);
  }
  return argv.parseSync();
}
