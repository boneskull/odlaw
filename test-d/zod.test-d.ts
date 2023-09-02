/* eslint-disable @typescript-eslint/ban-types */
import {expectType} from 'tsd';
import {Argv} from 'yargs';
import z from 'zod';
import '../src/zod';

expectType<z.ZodlawOptions | undefined>(z.boolean()._zodlaw());
expectType<z.ZodlawOptions>(z.boolean().option()._zodlaw());

expectType<Argv<Omit<{}, 'foo'> & {foo: boolean | undefined}>>(
  z
    .boolean()
    .option()
    ._configureParser('foo', {} as Argv),
);

expectType<Argv<Omit<{}, 'foo'> & {foo: number}>>(
  z
    .boolean()
    .option()
    .count()
    ._configureParser('foo', {} as Argv),
);

expectType<Argv<Omit<{}, 'foo'> & {foo: number | undefined}>>(
  z.number()._configureParser('foo', {} as Argv),
);

expectType<Argv<Omit<{}, 'foo'> & {foo: string | undefined}>>(
  z.string()._configureParser('foo', {} as Argv),
);

expectType<Argv<Omit<{}, 'foo'> & {foo: string}>>(
  z.string()._configureParser('foo', {} as Argv, true),
);

expectType<Argv<Omit<{}, 'foo'> & {foo: 'a' | 'b' | 'c' | undefined}>>(
  z.enum(['a', 'b', 'c'])._configureParser('foo', {} as Argv),
);
