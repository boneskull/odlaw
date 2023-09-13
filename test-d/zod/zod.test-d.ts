import '../../src/zod/augments';

import {expectType} from 'tsd';
import z from 'zod';
import {YargsType} from '../../src/zod';

expectType<YargsType<boolean>>(z.boolean()._yargsType);

expectType<z.ZodBoolean>(z.boolean().option());
expectType<z.ZodBoolean>(z.boolean().count());
expectType<{type: 'boolean'; demandOption?: boolean}>(
  z.boolean()._toYargsOptions(),
);

// common props
expectType<z.ZodBoolean>(z.boolean().alias(['alice', 'bob']));

expectType<z.ZodDefault<z.ZodString>>(z.string().default('foo'));
// expectType<{type: 'string'; demandOption?: boolean}>(
//   z.string().default('foo')._toYargsOptions(),
// );

expectType<{
  type: 'boolean';
  alias: string[] | string;
  demandOption?: boolean;
}>(z.boolean().alias(['alice', 'bob'])._toYargsOptions());

expectType<OdOption<z.ZodBoolean, {count: true}>>(z.boolean().count());

expectType<OdOption<z.ZodBoolean, {count: true; alias: 'bob'}>>(
  z.boolean().count().alias('bob'),
);

// strict mode
expectType<{type: 'boolean'; demandOption: true}>(
  z.boolean()._toYargsOptions(true),
);

// boolean specific
expectType<{type: 'boolean'; demandOption: false; count: true}>(
  z.boolean().count()._toYargsOptions(false),
);

// expectAssignable<
//   yargs.Argv<{
//     foo: {type: 'boolean'; demandOption: false};
//     bar: {type: 'string'; demandOption: false};
//     baz: {type: 'number'; demandOption: false};
//   }>
// >(
//   z
//     .object({
//       foo: z.boolean(),
//       bar: z.string(),
//       baz: z.number(),
//     })
//     ._toYargs({} as yargs.Argv),
// );

// expectAssignable<
//   yargs.Argv<{
//     foo: {type: 'boolean'; demandOption: true};
//     bar: {type: 'string'; demandOption: true};
//     baz: {type: 'number'; demandOption: true};
//   }>
// >(
//   z
//     .object({
//       foo: z.boolean(),
//       bar: z.string(),
//       baz: z.number(),
//     })
//     .strict()
//     ._toYargs({} as yargs.Argv),
// );

// printType(
//   z
//     .object({
//       foo: z.boolean().demandOption(),
//       bar: z.string(),
//       baz: z.number(),
//     })
//     ._toYargs({} as yargs.Argv),
// );
// expectAssignable<
//   yargs.Argv<{
//     foo: {type: 'boolean'; demandOption: true};
//     bar: {type: 'string'; demandOption: false};
//     baz: {type: 'number'; demandOption: false};
//   }>
// >(
//   z
//     .object({
//       foo: z.boolean().demandOption(),
//       bar: z.string(),
//       baz: z.number(),
//     })
//     ._toYargs({} as yargs.Argv),
// );
