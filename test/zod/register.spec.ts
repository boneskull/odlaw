import '../../src/zod/augments';

import unexpected from 'unexpected';
import zod from 'zod';
import {register, unregister} from '../../src/zod';
import {kOd} from '../../src/zod/register';

const expect = unexpected.clone();

describe('odlaw', function () {
  describe('while registered', function () {
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

    it('should allow creation of a ZodBoolean', function () {
      expect(z.boolean(), 'to be a', z.ZodBoolean);
    });

    it('should allow creation of a ZodString', function () {
      expect(z.string(), 'to be a', z.ZodString);
    });

    it('should allow creation of a ZodNumber', function () {
      expect(z.number(), 'to be a', z.ZodNumber);
    });

    it('should allow creation of a ZodArray', function () {
      expect(z.array(z.string()), 'to be a', z.ZodArray);
    });

    it('should allow creation of a ZodEnum', function () {
      expect(z.enum(['foo', 'bar']), 'to be a', z.ZodEnum);
    });

    it('should allow creation of a ZodObject', function () {
      expect(z.object({}), 'to be a', z.ZodObject);
    });

    it('should allow the creation of an unsupported ZodOptional', function () {
      expect(z.bigint().optional(), 'to be a', z.ZodOptional);
    });

    it('should allow the creation of an unsupported ZodArray', function () {
      expect(z.array(z.object({})), 'to be a', z.ZodArray);
    });

    it('should add a symbol to the ZodObject prototype', function () {
      expect(z.ZodObject.prototype, 'to have property', kOd);
    });

    it('should add a symbol to the ZodBoolean prototype', function () {
      expect(z.ZodBoolean.prototype, 'to have property', kOd);
    });

    it('should add a symbol to the ZodString prototype', function () {
      expect(z.ZodString.prototype, 'to have property', kOd);
    });

    it('should add a symbol to the ZodNumber prototype', function () {
      expect(z.ZodNumber.prototype, 'to have property', kOd);
    });

    it('should add a symbol to the ZodArray prototype', function () {
      expect(z.ZodArray.prototype, 'to have property', kOd);
    });

    it('should add a symbol to the ZodEnum prototype', function () {
      expect(z.ZodEnum.prototype, 'to have property', kOd);
    });

    it('should add a symbol to the ZodOptional prototype', function () {
      expect(z.ZodOptional.prototype, 'to have property', kOd);
    });

    describe('when a patched function is called on a ZodArray of an unsupported type', function () {
      it('should throw', function () {
        expect(
          () => z.array(z.object({})).defaultDescription('foo'),
          'to throw a',
          TypeError,
        );
      });
    });

    describe('when a patched function is called on a ZodOptional of an unsupported type', function () {
      it('should throw', function () {
        expect(
          () => z.bigint().optional().defaultDescription('foo'),
          'to throw a',
          TypeError,
        );
      });
    });
  });
});
