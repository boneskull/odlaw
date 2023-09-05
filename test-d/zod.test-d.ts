/* eslint-disable @typescript-eslint/ban-types */
import {expectType} from 'tsd';
import type * as yargs from 'yargs';
import z from 'zod';
import '../src/zod';

// _zodlaw()
expectType<z.ZodlawOptions | undefined>(z.boolean()._def.zodlawOptions);
expectType<z.ZodlawOptions>(z.boolean().option()._def.zodlawOptions);

// common props
expectType<{
  type: 'boolean';
  alias: string | readonly string[];
  global: true;
  hidden: true;
  deprecated: 'because alice quit tech';
  defaultDescription: 'alice is a boolean';
  group: `alice 'n' bob`;
  demandOption: false;
}>(
  z
    .boolean()
    .alias(['bob', 'alice'])
    .global()
    .hidden()
    .deprecated('because alice quit tech')
    .defaultDescription('alice is a boolean')
    .group(`alice 'n' bob`)
    ._toYargsOptions(false),
);

// last one wins
expectType<{type: 'boolean'; alias: string | readonly string[]}>(
  z.boolean().alias('alice').alias('bob')._toYargsOptions(false),
);

// strict mode
expectType<{type: 'boolean'; demandOption: true}>(
  z.boolean()._toYargsOptions(true),
);

// boolean specific
expectType<{type: 'boolean'; demandOption: false; count: true}>(
  z.boolean().count()._toYargsOptions(false),
);

expectType<
  yargs.Argv<{
    foo: {type: 'boolean'; demandOption: false};
    bar: {type: 'string'; demandOption: false};
    baz: {type: 'number'; demandOption: false};
  }>
>(
  z
    .object({
      foo: z.boolean(),
      bar: z.string(),
      baz: z.number(),
    })
    ._toYargs({} as yargs.Argv),
);

expectType<
  yargs.Argv<{
    foo: {type: 'boolean'; demandOption: true};
    bar: {type: 'string'; demandOption: true};
    baz: {type: 'number'; demandOption: true};
  }>
>(
  z
    .object({
      foo: z.boolean(),
      bar: z.string(),
      baz: z.number(),
    })
    .strict()
    ._toYargs({} as yargs.Argv),
);

expectType<
  yargs.Argv<{
    foo: {type: 'boolean'; demandOption: true};
    bar: {type: 'string'; demandOption: false};
    baz: {type: 'number'; demandOption: false};
  }>
>(
  z
    .object({
      foo: z.boolean().demandOption(),
      bar: z.string(),
      baz: z.number(),
    })
    ._toYargs({} as yargs.Argv),
);
