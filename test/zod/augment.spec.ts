import '../../src/zod/augments';

import unexpected from 'unexpected';
import zod from 'zod';
import {register, unregister} from '../../src/zod';

const expect = unexpected.clone();

describe('od', function () {
  // let z: typeof zod;
  let z: typeof zod;

  beforeEach(function () {
    z = register(zod);
  });

  afterEach(function () {
    unregister(zod);
  });

  it('should allow creation of a ZodOptional', function () {
    expect(z.boolean().optional(), 'to be a', z.ZodOptional);
  });
});
