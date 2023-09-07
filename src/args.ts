import {Argv} from 'yargs';
import z from 'zod';

export function configureYargs<T extends z.AnyZodObject, U>(
  yargs: Argv<U>,
  schema: T,
) {
  return schema._toYargs(yargs);
}
