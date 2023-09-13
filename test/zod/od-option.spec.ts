import unexpected from 'unexpected';
import zod from 'zod';

import {getYargsType, register, unregister} from '../../src/zod';
import {SUPPORTED_OPTION_ZOD_TYPES} from '../../src/zod/register';

const expect = unexpected.clone();

describe('option handling', function () {
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

  describe('_yargsType', function () {
    describe('unsupported types', function () {
      for (const typeName of Object.values(zod.ZodFirstPartyTypeKind)) {
        if (
          typeName in zod &&
          !SUPPORTED_OPTION_ZOD_TYPES.has(zod[typeName] as any)
        ) {
          describe(typeName, function () {
            it('should not have a _yargsType', function () {
              // @ts-expect-error no such prop
              expect(z.date()._yargsType, 'to be undefined');
            });
          });
        }
      }
    });

    describe('supported types', function () {
      for (const ctor of SUPPORTED_OPTION_ZOD_TYPES) {
        describe(ctor.name, function () {
          let schema: zod.ZodTypeAny & {_yargsType: any};

          beforeEach(function () {
            schema =
              ctor.create.length === 1
                ? // @ts-expect-error wonky usage
                  ctor.create({})
                : // @ts-expect-error wonky usage
                  ctor.create(z.string(), {});
          });

          it('should have a _yargsType', function () {
            expect(schema._yargsType, 'to be defined');
          });

          it('should be set to the equivalent yargs type', function () {
            expect(schema._yargsType, 'to equal', getYargsType(schema));
          });
        });
      }
    });

    // it('should exist on supported types', function () {
    //   expect(z.boolean()._yargsType, 'to equal', {type: 'boolean'});
    // });

    it('should be set to the equivalent yargs type', function () {
      expect(
        z.boolean().describe('pigs').option({
          defaultDescription: 'cows',
        }),
        'to satisfy',
        {
          _yargsType: {type: 'boolean'},
          _def: {odOptions: {defaultDescription: 'cows'}},
        },
      );
    });
  });

  describe('_toYargsOptions()', function () {
    it('should prefer the description in the inner type', function () {
      const schema = z.boolean().describe('pigs').option({
        describe: 'hogs',
      });
      expect(schema._toYargsOptions(), 'to satisfy', {
        describe: 'pigs',
      });
    });

    it('should return the description when set only via option()', function () {
      const schema = z.boolean().option({
        describe: 'hogs',
      });
      expect(schema._toYargsOptions(), 'to satisfy', {
        describe: 'hogs',
      });
    });

    it('should return the description when set only via inner type', function () {
      const schema = z.boolean().describe('pigs');
      expect(schema._toYargsOptions(), 'to satisfy', {
        describe: 'pigs',
      });
    });

    describe('when a schema does not set `demandOption`', function () {
      it('should assume the option is not demanded', function () {
        const schema = z.boolean();
        expect(
          schema._toYargsOptions(),
          'not to have property',
          'demandOption',
        );
      });
    });

    describe('when a schema sets `demandOption`', function () {
      it('should use the schema value', function () {
        const schema = z.boolean().demandOption();
        expect(schema._toYargsOptions(), 'to satisfy', {
          demandOption: true,
        });
      });
    });

    describe('when called on an unsupported type', function () {
      it('should throw', function () {
        // @ts-expect-error - no such method
        expect(() => z.date()._toYargsOptions(), 'to throw a', TypeError);
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
          // @ts-expect-error - no such method
          () => z.boolean()._toYargsOptionsRecord(),
          'to throw a',
          TypeError,
        );
      });
    });

    describe('when called on an OdOption', function () {
      it('should throw', function () {
        expect(
          // @ts-expect-error - no such method
          () => z.boolean().defaultDescription('mooo')._toYargsOptionsRecord(),
          'to throw a',
          TypeError,
        );
      });
    });
  });
});
