import '../../src/zod/augments';

import unexpected from 'unexpected';
import yargs from 'yargs/yargs';
import zod, {ZodError} from 'zod';
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
      expect(() => z.command(), 'to throw a', ZodError);
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
          expect(() => z.command(1), 'to throw a', z.ZodError);
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
        describe('when called on a non-command object', function () {
          it('should throw', function () {
            expect(
              () => z.object({name: z.string()}).positional('file', z.string()),
              'to throw a',
              TypeError,
            );
          });
        });

        describe('when called on a command object', function () {
          it('should create a new object containing the positional information', function () {
            const zCommand = z
              .object({name: z.string()})
              .command('foo', 'bar')
              .positional('file', z.string());
            expect(zCommand, 'to satisfy', {
              _def: {
                odPositionals: {
                  file: expect.it('to be a', z.ZodString),
                },
              },
            });
          });
        });

        describe('when called with invalid ZodType schema', function () {
          it('should throw', function () {
            expect(
              // @ts-expect-error bad positional type
              () => z.command('foo', 'bar').positional('file', z.object({})),
              'to throw a',
              TypeError,
            );
          });
        });
      });

      describe('_toYargsOptionsRecord', function () {
        it('should return a record of all yargs options in the shape', function () {
          const zCommand = z.object({
            name: z.string(),
            file: z.string(),
            count: z.number(),
          });
          expect(zCommand._toYargsOptionsRecord(), 'to satisfy', {
            name: {type: 'string'},
            file: {type: 'string'},
            count: {type: 'number'},
          });
        });
      });

      describe('middlewares()', function () {
        it('should respect middlewares', function () {
          const command = z
            .command({
              command: 'foo',
              description: 'bar',
            })
            .middlewares((argv) => {
              argv.butts = 1;
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

      describe('_toYargsCommand()', function () {
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

        describe('when the command contains positionals', function () {
          describe('when the positional is numeric', function () {
            it('should return a Yargs instance configured with the positionals', function () {
              const command = z
                .object({
                  bar: z.boolean(),
                })
                .command('foo <number>', 'bar')
                .positional('number', z.number());

              expect(
                command
                  ._toYargsCommand(yargs(['foo', '2', '--bar']))
                  .parseSync(),
                'to satisfy',
                {
                  bar: true,
                  number: 2,
                },
              );
            });
          });

          describe('when the positional is a string', function () {
            it('should return a Yargs instance configured with the positionals', function () {
              const command = z
                .object({
                  bar: z.boolean(),
                })
                .command('foo <value>', 'bar')
                .positional('value', z.string());

              expect(
                command
                  ._toYargsCommand(yargs(['foo', '2', '--bar']))
                  .parseSync(),
                'to satisfy',
                {
                  bar: true,
                  value: '2',
                },
              );
            });
          });
        });
      });
    });
  });
});
