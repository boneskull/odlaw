import {expectType} from 'tsd';
import z from 'zod';
import {OdCommand} from '../../src/zod';

expectType<
  OdCommand<
    z.ZodObject<
      {foo: z.ZodBoolean},
      'strip',
      z.ZodTypeAny,
      {foo: boolean},
      {foo: boolean}
    >
  >
>(z.object({foo: z.boolean()}).command('bar', 'desc'));

expectType<OdCommand<z.ZodObject<{foo: z.ZodBoolean}>>>(
  z
    .object({
      bar: z.boolean(),
    })
    .command('foo', 'bar')
    .middlewares([
      (argv) => {
        argv.butts = 1;
      },
    ]),
);
