/* eslint-disable @typescript-eslint/ban-types */
import {expectAssignable, expectType} from 'tsd';
import z from 'zod';
import {OdCommand, OdType, YargsType} from '../src/zod';
import '../src/zod/augment';

expectType<YargsType<boolean>>(z.boolean()._yargsType);
expectType<OdType<z.ZodBoolean>>(z.boolean().option());
expectType<OdType<z.ZodBoolean, {count: true}>>(z.boolean().count());
expectAssignable<{type: 'boolean'; demandOption: false}>(
  z.boolean()._toYargsOptions(false),
);

// type OdOptions<
//     T extends z.ZodTypeAny,
//     ZO extends DynamicOdOptions = DynamicOdOptions,
//   > = T['_input'] extends OdInputType
//     ? SimpleMerge<T['_odOptions'], Omit<ZO, 'type'>>
//     : T['_odOptions'];

// common props
expectType<OdType<z.ZodBoolean, {alias: ['alice', 'bob']}>>(
  z.boolean().alias(['alice', 'bob']),
);

expectType<z.ZodDefault<z.ZodString>>(z.string().default('foo'));
expectAssignable<{type: 'string'; demandOption: false}>(
  z.string().default('foo')._toYargsOptions(false),
);

expectAssignable<{
  type: 'boolean';
  alias: string | readonly string[];
  demandOption: false;
}>(z.boolean().alias(['alice', 'bob'])._toYargsOptions(false));

expectType<OdType<z.ZodBoolean, {count: true}>>(z.boolean().count());

expectType<OdType<z.ZodBoolean, {count: true; alias: 'bob'}>>(
  z.boolean().count().alias('bob'),
);

// strict mode
expectAssignable<{type: 'boolean'; demandOption: true}>(
  z.boolean()._toYargsOptions(true),
);

// boolean specific
expectAssignable<{type: 'boolean'; demandOption: false; count: true}>(
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
>(z.object({foo: z.boolean()}).command('bar'));
