import '../../src/zod/augments';

import unexpected from 'unexpected';
import yargs from 'yargs/yargs';
import zod from 'zod';
import {register, unregister} from '../../src/zod';

const expect = unexpected.clone();

describe('command handling', function () {
  let z: typeof zod;

  beforeEach(function () {
    z = register(zod);
  });

  afterEach(function () {
    unregister(zod);
  });

  describe('z.command()', function () {
    it('should accept a name and description', function () {
      expect(z.command('foo', 'bar'), 'to be a', z.ZodObject);
    });

    it('should accept a name, description, and handler', function () {
      expect(
        z.command('foo', 'bar', () => {}),
        'to be a',
        z.ZodObject,
      );
    });

    it('should accept a ZodObject and name', function () {
      expect(
        z.command(z.object({}, {description: 'bar'}), 'foo'),
        'to be a',
        z.ZodObject,
      );
    });

    it('should accept a ZodObject and name, using description from ZodObject', function () {
      expect(
        z.command(z.object({}, {description: 'bar'}), 'foo'),
        'to satisfy',
        {
          description: 'bar',
        },
      );
    });

    it('should set the "unknown keys" behavior to "passthrough"', function () {
      expect(
        z.command(z.object({}, {description: 'bar'}), 'foo'),
        'to satisfy',
        {
          _def: {unknownKeys: 'passthrough'},
        },
      );
    });

    it('should accept a ZodObject, name, description, and handler', function () {
      expect(
        z.command(z.object({}), 'foo', 'bar', () => {}),
        'to be a',
        z.ZodObject,
      );
    });

    it('should accept an OdCommandOptions', function () {
      expect(z.command({command: 'foo'}), 'to be a', z.ZodObject);
    });

    it('should accept params containing OdCommandOptions', function () {
      expect(
        z.command({command: 'foo', description: 'bar'}),
        'to be a',
        z.ZodObject,
      );
    });

    it('should accept a ZodObject and OdCommandOptions', function () {
      expect(
        z.command(z.object({}, {description: 'bar'}), {command: 'foo'}),
        'to be a',
        z.ZodObject,
      );
    });

    it('should not accept no parameters', function () {
      // @ts-expect-error invalid usage
      expect(() => z.command(), 'to throw a', TypeError);
    });

    it('should not accept a ZodObject and whatever else', function () {
      // @ts-expect-error invalid usage
      expect(() => z.command(z.object({}), 1), 'to throw a', TypeError);
    });
  });

  describe('ZodObject', function () {
    describe('method', function () {
      describe('command()', function () {
        it('should accept a name and description', function () {
          expect(z.object({}).command('foo', 'bar'), 'to be a', z.ZodObject);
        });

        it('should accept a name, description, and handler', function () {
          expect(
            z.object({}).command('foo', 'bar', () => {}),
            'to be a',
            z.ZodObject,
          );
        });

        it('should not accept a ZodObject and command name', function () {
          expect(
            () =>
              // @ts-expect-error invalid
              z.object({}).command(z.object({}, {description: 'bar'}), 'foo'),
            'to throw a',
            TypeError,
          );
        });

        it('should set the "unknown keys" behavior to "passthrough"', function () {
          expect(z.object({}).command('foo', 'bar'), 'to satisfy', {
            _def: {unknownKeys: 'passthrough'},
          });
        });

        it('should accept an OdCommandOptions', function () {
          expect(
            z.object({}).command({command: 'foo'}),
            'to be a',
            z.ZodObject,
          );
        });

        it('should accept params containing OdCommandOptions', function () {
          expect(
            z.object({}).command({command: 'foo', description: 'bar'}),
            'to be a',
            z.ZodObject,
          );
        });

        it('should not accept no parameters', function () {
          // @ts-expect-error invalid usage
          expect(() => z.object({}).command(), 'to throw a', TypeError);
        });

        it('should not accept whatever', function () {
          // @ts-expect-error invalid usage
          expect(() => z.command(1), 'to throw a', TypeError);
        });

        it('should return a new "partial" ZodObject', function () {
          const zCommand = z.object({name: z.string()}).command('foo', 'bar');
          expect(
            zCommand,
            'to satisfy',
            expect.it('to be an', z.ZodObject).and('to satisfy', {
              _def: {odCommandOptions: {command: 'foo'}},
              description: 'bar',
              shape: {name: expect.it('to be a', z.ZodOptional)},
            }),
          );
        });

        it('should always use the most recent information', function () {
          expect(z.command('foo', 'bar').command('baz', 'quux'), 'to satisfy', {
            _def: {description: 'quux', odCommandOptions: {command: 'baz'}},
          });
        });
      });

      describe('positional()', function () {
        it('should create a new object containing the positional', function () {
          const zCommand = z
            .object({name: z.string()})
            .positional('file', z.string());
          expect(zCommand, 'to satisfy', {
            shape: {
              name: expect.it('to be a', z.ZodOptional),
              _: expect.it('to be a', z.ZodTuple),
            },
          });
        });
      });

      describe('_toYargsCommand()', function () {
        describe('when the command contains no options', function () {
          it('should return a Yargs instance configured with the command', function () {
            const command = z.command({
              command: 'foo',
              middlewares: [
                (argv) => {
                  argv.butts = 1;
                },
              ],
              description: 'bar',
            });
            expect(
              command._toYargsCommand(yargs(['foo'])).parseSync(),
              'to satisfy',
              {
                butts: 1,
              },
            );
          });
        });

        describe('when the command contains options', function () {
          it('should return a Yargs instance configured with the command', function () {
            const command = z
              .object({
                bar: z.boolean(),
              })
              .command('foo', 'bar')
              .middlewares([
                (argv) => {
                  argv.butts = 1;
                },
              ]);

            expect(
              command._toYargsCommand(yargs(['foo'])).parseSync(),
              'to satisfy',
              {
                butts: 1,
              },
            );
          });
        });
      });
    });
  });
});
