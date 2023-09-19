import * as y from 'yargs';
import z from 'zod';

export interface ConfigureYargsOptions {
  scriptName?: string;
}

/**
 * @param argv - Yargs instance
 * @param schema - Zod schema
 * @param opts - Options
 * @returns Yargs instance configured with Zod schema and optionally
 *   `scriptName`
 * @internal
 */
export function configureYargs<T extends z.AnyZodObject, U>(
  argv: y.Argv<U>,
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
