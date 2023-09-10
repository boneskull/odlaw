/* eslint-disable @typescript-eslint/ban-types */
import {expectAssignable, expectType} from 'tsd';
import z from 'zod';
import {ActuallyAnyZodObject, OdCommand, OdMiddleware} from '../../src/zod';

type someZodObject = z.ZodObject<
  {foo: z.ZodBoolean},
  'strip',
  z.ZodTypeAny,
  {foo: boolean},
  {foo: boolean}
>;

expectType<OdCommand<someZodObject, {command: string | readonly string[]}>>(
  z.object({foo: z.boolean()}).command('bar', 'desc'),
);

expectType<someZodObject>(
  z.object({foo: z.boolean()}).command('bar', 'desc')._odInnerType,
);

expectType<{command: string | readonly string[]}>(
  z.object({foo: z.boolean()}).command('bar', 'desc')._def.odCommandOptions,
);

expectType<string>(
  z.object({foo: z.boolean()}).command('bar', 'desc')._def.description,
);

expectAssignable<
  OdCommand<
    ActuallyAnyZodObject,
    {
      command: string | readonly string[];
      middlewares: OdMiddleware<ActuallyAnyZodObject>[];
    }
  >
>(
  z.command({command: 'foo'}, {description: 'bar'}).middlewares([
    (argv) => {
      argv.butts = 1;
    },
  ]),
);

expectAssignable<
  OdCommand<
    someZodObject,
    {
      command: string | readonly string[];
      middlewares: OdMiddleware<someZodObject>[];
    }
  >
>(
  z
    .object({
      foo: z.boolean(),
    })
    .command('bar', 'baz')
    .middlewares([
      (argv) => {
        argv.butts = 1;
      },
    ]),
);
