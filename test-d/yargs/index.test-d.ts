import {expectType} from 'tsd';
import type * as y from 'yargs';
import z from 'zod';
import {ShapeToOdOptions} from '../../src';
import {configureYargs, odlawSync} from '../../src/yargs';
import '../../src/yargs/augment';

expectType<
  y.Argv<
    Omit<{}, 'foo'> &
      y.InferredOptionTypes<ShapeToOdOptions<{foo: z.ZodBoolean}>>
  >
>(configureYargs({} as y.Argv, z.object({foo: z.boolean()})));

expectType<{
  [x: string]: unknown;
  foo: boolean;
  _: (string | number)[];
  $0: string;
}>(odlawSync('butts', z.object({foo: z.boolean()}), {args: ['--foo']}));

expectType<{
  [x: string]: unknown;
  foo?: boolean;
  _: (string | number)[];
  $0: string;
}>(
  odlawSync('butts', z.object({foo: z.boolean().group('a')}), {
    args: ['--foo'],
  }),
);
