import unexpected from 'unexpected';
import zod from 'zod';

import {register, unregister} from '../../../src/zod';

const expect = unexpected.clone();

describe('od', function () {
  let z: typeof zod;

  beforeEach(function () {
    z = register(zod);
  });

  afterEach(function () {
    unregister(zod);
  });

  describe('option', function () {
    describe('boolean', function () {
      it('should not throw', function () {
        expect(() => z.boolean().option({}), 'not to throw');
      });
    });
  });

  describe('unsupported types', function () {
    it('should not have a _yargsType', function () {
      expect(z.date()._yargsType, 'to be', undefined);
    });
  });

  describe('_yargsType', function () {
    it('should be set to the equivalent yargs type', function () {
      expect(
        z.boolean().describe('pigs').option({
          defaultDescription: 'cows',
        }),
        'to satisfy',
        {_yargsType: {type: 'boolean'}},
      );
    });
  });

  describe('_toYargsOptions()', function () {
    it('should prefer the description in the inner type', function () {
      const schema = z.boolean().describe('pigs').option({
        describe: 'hogs',
      });
      expect(schema._toYargsOptions(false), 'to satisfy', {
        describe: 'pigs',
      });
    });

    it('should return the description when set only via option()', function () {
      const schema = z.boolean().option({
        describe: 'hogs',
      });
      expect(schema._toYargsOptions(false), 'to satisfy', {
        describe: 'hogs',
      });
    });

    it('should return the description when set only via inner type', function () {
      const schema = z.boolean().describe('pigs');
      expect(schema._toYargsOptions(false), 'to satisfy', {
        describe: 'pigs',
      });
    });

    describe('when a schema does not set `demandOption`', function () {
      it('should pass through the value of "strict"', function () {
        const schema = z.boolean();
        expect(schema._toYargsOptions(true), 'to satisfy', {
          demandOption: true,
        });
      });
    });

    describe('when a schema sets `demandOption`', function () {
      it('should use the schema value', function () {
        const schema = z.boolean().demandOption();
        expect(schema._toYargsOptions(false), 'to satisfy', {
          demandOption: true,
        });
      });
    });

    describe('when called on an unsupported type', function () {
      it('should throw', function () {
        expect(() => z.date()._toYargsOptions(true), 'to throw a', TypeError);
      });
    });
  });

  describe('_toYargsOptionsRecord()', function () {
    describe('when called on a ZodObject', function () {
      it('should not throw', function () {
        expect(
          () =>
            z
              .object({
                foo: z.boolean(),
              })
              ._toYargsOptionsRecord(),
          'not to throw',
        );
      });
    });

    describe('when called on a non-ZodObject ZodType', function () {
      it('should throw', function () {
        expect(
          () => z.boolean()._toYargsOptionsRecord(),
          'to throw a',
          TypeError,
        );
      });
    });

    describe('when called on an OdType', function () {
      it('should throw', function () {
        expect(
          () => z.boolean().defaultDescription('mooo')._toYargsOptionsRecord(),
          'to throw a',
          TypeError,
        );
      });
    });
  });
});
