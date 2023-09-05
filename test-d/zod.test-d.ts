/* eslint-disable @typescript-eslint/ban-types */
import {expectType} from 'tsd';
import z from 'zod';
import '../src/zod';

// _zodlaw()
expectType<z.ZodlawOptions | undefined>(z.boolean()._def.zodlawOptions);
expectType<z.ZodlawOptions>(z.boolean().option()._def.zodlawOptions);

// common props
expectType<{
  type: 'boolean';
  alias: ['bob', 'alice'];
  global: true;
  hidden: true;
  deprecated: 'because alice quit tech';
  defaultDescription: 'alice is a boolean';
  group: `alice 'n' bob`;
}>(
  z
    .boolean()
    .alias(['bob', 'alice'])
    .global()
    .hidden()
    .deprecated('because alice quit tech')
    .defaultDescription('alice is a boolean')
    .group(`alice 'n' bob`)
    ._toYargsOptions(),
);

// last one wins
expectType<{type: 'boolean'; alias: 'bob'}>(
  z.boolean().alias('alice').alias('bob')._toYargsOptions(),
);

// strict mode
expectType<{type: 'boolean'; demandOption: true}>(
  z.boolean()._toYargsOptions(true),
);

// boolean specific
expectType<{type: 'boolean'; demandOption: false; count: true}>(
  z.boolean().count()._toYargsOptions(),
);
