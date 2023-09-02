import {expectType} from 'tsd';
import z from 'zod';
import './zod';

expectType<z.ZodlawOptions | undefined>(z.boolean().zodlaw());
expectType<z.ZodlawOptions>(z.boolean().option().zodlaw());
expectType<boolean | undefined>(z.boolean().zodlaw()!.count);
expectType<true>(z.boolean().count().zodlaw()!.count);
