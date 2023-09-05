import zod from 'zod';
import {register} from './zodlaw';

export const z = register(zod);

export * from './config';
