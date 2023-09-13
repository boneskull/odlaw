import '../../src/zod/augments';

import unexpected from 'unexpected';
import yargs from 'yargs/yargs';
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

  describe('zod.command()', function () {
    it('should allow a command to be created', function () {
      expect(z.command('foo', 'bar'), 'to be a', z.ZodObject);
    });
  });

  describe('OdCommand', function () {
    describe('static method', function () {
      describe('create()', function () {
        it('should return a new OdCommand with all keys optional', function () {
          const zName = z.object({name: z.string()});
          const zCommand = z.command(zName, 'foo', 'bar');
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
      });
    });

    describe('method', function () {
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

      describe('command()', function () {
        it('should use the latest information', function () {
          expect(z.command('foo', 'bar').command('baz', 'quux'), 'to satisfy', {
            _def: {description: 'quux', odCommandOptions: {command: 'baz'}},
          });
        });
      });
    });
  });
});
