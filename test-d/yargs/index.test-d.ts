/* eslint-disable @typescript-eslint/ban-types */
import {expectType, printType} from 'tsd';
import {Argv, InferredOptionTypes} from 'yargs';
import z from 'zod';
import {configureYargs, odlawSync} from '../../src/yargs';
import '../../src/yargs/augment';

expectType<
  Argv<
    Omit<{}, 'foo'> &
      InferredOptionTypes<{foo: {type: 'boolean'; demandOption: false}}>
  >
>(configureYargs({} as Argv, z.object({foo: z.boolean()})));

printType(odlawSync('butts', z.object({foo: z.boolean()}), {args: ['--foo']}));

expectType<{[x: string]: unknown; foo?: boolean; _: (string | number)[]}>(
  odlawSync('butts', z.object({foo: z.boolean()}), {args: ['--foo']}),
);

// expectType<
//   Argv<
//     Omit<object, 'foo'> &
//       InferredOptionTypes<{foo: {type: 'boolean'; demandOption: false}}>
//   >
// >(yargs().schema(z.object({foo: z.boolean()})));
