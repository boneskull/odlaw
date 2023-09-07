import zod from 'zod';
import {register} from './zod/monkeypatch';

export const z = register(zod);

export * from './config';
