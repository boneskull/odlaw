import zod from 'zod';
import {register} from './zod/zodtype';

export const z = register(zod);

export * from './external';
