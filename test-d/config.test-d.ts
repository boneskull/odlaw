import {printType} from 'tsd';
import z from 'zod';
import {odlaw} from '../src/yargs';

printType(odlaw('foo', z.object({foo: z.boolean()})));
