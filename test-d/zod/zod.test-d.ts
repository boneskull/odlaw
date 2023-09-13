import '../../src/zod/augments';

import {expectAssignable, expectType} from 'tsd';
import z from 'zod';
import {OdOptions, YargsType} from '../../src/zod';

expectType<YargsType<boolean>>(z.boolean()._yargsType);

expectType<z.ZodBoolean & {_def: z.ZodBooleanDef & {odOptions: OdOptions}}>(
  z.boolean().option({}),
);

expectType<
  z.ZodBoolean & {
    _def: z.ZodBooleanDef & {odOptions: OdOptions & {count: true}};
  }
>(z.boolean().count());

expectType<
  z.ZodBoolean & {
    _def: z.ZodBooleanDef & {odOptions: OdOptions & {alias: ['alice', 'bob']}};
  }
>(z.boolean().alias(['alice', 'bob']));

expectType<
  z.ZodBoolean & {
    _def: z.ZodBooleanDef & {odOptions: OdOptions & {global: true}};
  }
>(z.boolean().global());

expectType<
  z.ZodBoolean & {
    _def: z.ZodBooleanDef & {odOptions: OdOptions & {hidden: true}};
  }
>(z.boolean().hidden());

expectType<
  z.ZodString & {
    _def: z.ZodStringDef & {odOptions: OdOptions & {normalize: true}};
  }
>(z.string().normalize());

expectType<
  z.ZodBoolean & {
    _def: z.ZodBooleanDef & {
      odOptions: OdOptions & {defaultDescription: 'bob'};
    };
  }
>(z.boolean().defaultDescription('bob'));

expectType<
  z.ZodBoolean & {
    _def: z.ZodBooleanDef & {odOptions: OdOptions & {group: 'alice'}};
  }
>(z.boolean().group('alice'));

expectType<
  z.ZodBoolean & {
    _def: z.ZodBooleanDef & {odOptions: OdOptions & {demandOption: true}};
  }
>(z.boolean().demandOption());

expectType<
  z.ZodBoolean & {
    _def: z.ZodBooleanDef & {odOptions: OdOptions & {demandOption: 'because'}};
  }
>(z.boolean().demandOption('because'));

expectType<
  z.ZodString & {
    _def: z.ZodStringDef & {odOptions: OdOptions & {nargs: 42}};
  }
>(z.string().nargs(42));

expectAssignable<z.ZodDefault<z.ZodString>>(z.string().default('foo'));
expectAssignable<z.ZodOptional<z.ZodString>>(z.string().optional());

// printType(z.boolean()._toYargsOptions());
expectType<{
  type: 'boolean';
}>(z.boolean()._toYargsOptions());

// expectType<z.ZodBoolean>(z.boolean().count());

// expectType<z.ZodBoolean>(z.boolean().count().alias('bob'));

// boolean specific
// expectType<{type: 'boolean'; demandOption: false; count: true}>(
//   z.boolean().count()._toYargsOptions(),
// );

// expectType<{type: 'boolean'; demandOption: false; count: true}>(
//   z.boolean().option({count: true})._toYargsOptions(),
// );
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
