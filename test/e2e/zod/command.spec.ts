import unexpected from 'unexpected';
import yargs from 'yargs/yargs';
import zod from 'zod';
import {register, unregister} from '../../../src/zod';
import {OdCommand} from '../../../src/zod/command';

const expect = unexpected.clone();

describe('od', function () {
  let z: typeof zod;

  beforeEach(function () {
    z = register(zod);
  });

  afterEach(function () {
    unregister(zod);
  });

  describe('zod.command()', function () {
    it('should allow a command to be created', function () {
      expect(z.command('foo', 'desc'), 'to be a', OdCommand);
    });
  });

  describe('OdCommand', function () {
    describe('method', function () {
      describe('_toYargsCommand()', function () {
        describe('when the command contains no options', function () {
          it('should return a Yargs instance configured with the command', function () {
            const command = z.command('foo', {
              description: 'bar',
              middlewares: [
                (argv) => {
                  // @ts-expect-error no "butts" allowed
                  argv.butts = 1;
                },
              ],
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
