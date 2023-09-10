import zod from 'zod';
import {register} from './zod/register';

export const z = register(zod);

export * from './external';
