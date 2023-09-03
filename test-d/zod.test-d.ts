/* eslint-disable @typescript-eslint/ban-types */
import {expectType} from 'tsd';
import z from 'zod';
import '../src/zod';

// _zodlaw()
expectType<z.ZodlawOptions | undefined>(z.boolean()._zodlaw());
expectType<z.ZodlawOptions>(z.boolean().option()._zodlaw());

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
    ._configureOptions(),
);

// last one wins
expectType<{type: 'boolean'; alias: 'bob'}>(
  z.boolean().alias('alice').alias('bob')._configureOptions(),
);

// strict mode
expectType<{type: 'boolean'; demandOption: true}>(
  z.boolean()._configureOptions(true),
);

// boolean specific
expectType<{type: 'boolean'; demandOption: false; count: true}>(
  z.boolean().count()._configureOptions(),
);
