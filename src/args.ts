import {hideBin} from 'yargs/helpers';
import yargs from 'yargs/yargs';
import z from 'zod';

export function parseSync<T extends z.ZodTypeAny>(
  schema: T,
  argv: string[] = hideBin(process.argv),
) {
  return schema._toYargs(yargs(argv)).parseSync();
}
