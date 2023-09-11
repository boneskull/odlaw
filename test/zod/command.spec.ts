import '../../src/zod/augments';

import unexpected from 'unexpected';
import yargs from 'yargs/yargs';
import zod from 'zod';
import {OdCommand, register, unregister} from '../../src/zod';

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
      expect(
        z.command({command: 'foo'}, {description: 'bar'}),
        'to be a',
        OdCommand,
      );
    });
  });

  describe('OdCommand', function () {
    describe('static method', function () {
      describe('create()', function () {
        it('should return a new OdCommand with all keys optional', function () {
          const zName = z.object({name: z.string()});
          const zCommand = OdCommand.create(
            {command: 'foo'},
            {description: 'bar'},
            zName,
          );
          expect(
            zCommand,
            'to satisfy',
            expect.it('to be an', OdCommand).and('to satisfy', {
              _def: {odCommandOptions: {command: 'foo'}},
              description: 'bar',
              // TODO better ZodType equality check
              _odInnerType: {
                shape: {name: expect.it('to be a', z.ZodOptional)},
              },
            }),
          );
        });
      });
    });

    describe('method', function () {
      describe('_toYargsCommand()', function () {
        describe('when the command contains no options', function () {
          it('should return a Yargs instance configured with the command', function () {
            const command = z.command(
              {
                command: 'foo',
                middlewares: [
                  (argv) => {
                    argv.butts = 1;
                  },
                ],
              },
              {description: 'bar'},
            );
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
        it('should not exist', function () {
          expect(
            () =>
              z
                .command({command: 'foo'}, {description: 'bar'})
                // @ts-expect-error non-existent method
                .command('foo', 'bar'),
            'to throw',
          );
        });
      });
    });

    describe('as ZodObject', function () {
      const data = {
        points: 2314,
        unknown: 'asdf',
      };

      it('should strip unknown props by default', function () {
        const zData = z
          .object({points: z.number()})
          .command('foo', 'bar')
          .parse(data);
        expect(zData, 'to equal', {points: 2314});
      });

      it('should all unknown props to be overriden', function () {
        const zData = z
          .object({points: z.number()})
          .command('foo', 'bar')
          .strict()
          .passthrough()
          .strip()
          .passthrough()
          .parse(data);

        expect(zData, 'to equal', data);
      });

      describe('when passthrough is set', function () {
        it('should allow props to pass through', function () {
          const zData = z
            .object({points: z.number()})
            .command('foo', 'bar')
            .passthrough()
            .parse(data);

          expect(zData, 'to equal', data);
        });
      });
      describe('when strip is set', function () {
        it('should strip unknown props', function () {
          const zData = z
            .object({points: z.number()})
            .command('foo', 'bar')
            .strip()
            .parse(data);

          expect(zData, 'to equal', {points: 2314});
        });
      });

      describe('when strict is set', function () {
        it('should fail parsing', function () {
          const zData = z
            .object({points: z.number()})
            .command('foo', 'bar')
            .strict()
            .safeParse(data);

          expect(zData, 'to satisfy', {success: false});
        });
      });

      describe('when catchall is set', function () {
        it('should override strict', function () {
          const zCatch = z
            .object({first: z.string().optional()})
            .command('foo', 'bar')
            .strict()
            .catchall(z.number());

          expect(
            () =>
              zCatch.parse({
                asdf: 1234,
              }),
            'not to throw',
          );

          // should only run catchall validation
          // against unknown keys
          expect(
            () =>
              zCatch.parse({
                first: 'asdf',
                asdf: 1234,
              }),
            'not to throw',
          );
        });
      });

      describe('when provided optional keys', function () {
        it('should omit them from the parsed result', function () {
          const zOptionals = z
            .object({
              id: z.string(),
              set: z.string().optional(),
              unset: z.string().optional(),
            })
            .command('foo', 'bar');

          expect(
            zOptionals.parse({
              id: 'asdf',
              set: undefined,
            }),
            'to have keys',
            ['id', 'set'],
          );
        });
      });

      describe('setKey()', function () {
        it('should create a new OdCommand with the set key', function () {
          const zName = z.object({name: z.string()});
          const zCommand = zName.command('foo', 'bar');
          const zNameAndAge = zCommand.setKey('age', z.number());
          expect(
            zNameAndAge,
            'to satisfy',
            expect
              .it('to be an', OdCommand)
              .and('not to be', zCommand)
              .and('to satisfy', {
                _def: {odCommandOptions: {command: 'foo'}},
                description: 'bar',
                _odInnerType: {
                  shape: {name: expect.it('to be a', z.ZodOptional)},
                }, // TODO better ZodType equality check
              }),
          );
        });
      });

      describe('shape', function () {
        it('should be a partial of the original object', function () {
          const zName = z.object({name: z.string()});
          expect(zName.shape.name, 'to be a', z.ZodString);
          const zCommand = zName.command('foo', 'bar');
          expect(zCommand, 'to satisfy', {
            shape: {name: expect.it('to be a', z.ZodOptional)},
          });
          expect(zCommand.shape.name.unwrap(), 'to be a', z.ZodString);
        });
      });

      describe('_getCached()', function () {
        it('should return the keys and shape', function () {
          const shape = {name: z.string()};
          const zName = z.object(shape).command('foo', 'bar');
          expect(zName._getCached(), 'to satisfy', {
            shape: {name: expect.it('to be a', z.ZodOptional)},
            keys: ['name'],
          });
        });
      });

      describe('extend()', function () {
        let zPerson: OdCommand<any>;

        beforeEach(function () {
          zPerson = z
            .object({
              firstName: z.string(),
              lastName: z.string(),
            })
            .command('foo', 'bar');
        });

        it('should return a new OdCommand with the merged shape', function () {
          const zPersonWithNickname = zPerson.extend({
            nickname: z.string(),
          });

          expect(
            zPersonWithNickname,
            'to satisfy',
            expect
              .it('to be an', OdCommand)
              .and('not to be', zPerson)
              .and('to satisfy', {
                _def: {odCommandOptions: {command: 'foo'}},
                description: 'bar',
                // TODO better ZodType equality check
                _odInnerType: {
                  shape: {
                    ...zPerson.shape,
                    nickname: expect.it('to be a', z.ZodString),
                  },
                },
              }),
          );
        });
      });

      describe('augment()', function () {
        it('should return a new OdCommand with the augmented shape', function () {
          const zBeast = z
            .object({
              species: z.string(),
            })
            .command('foo', 'bar')
            .augment({
              population: z.number(),
            });

          // overwrites `species`
          const zAlteredBeast = zBeast.augment({
            species: z.array(z.string()),
          });

          expect(
            zAlteredBeast,
            'to satisfy',
            expect
              .it('to be an', OdCommand)
              .and('not to be', zBeast)
              .and('to satisfy', {
                _def: {odCommandOptions: {command: 'foo'}},
                description: 'bar',
                // TODO better ZodType equality check
                _odInnerType: {
                  shape: {
                    population: expect.it('to be', zBeast.shape.population),
                    species: expect.it('to be', zAlteredBeast.shape.species),
                  },
                },
              }),
          );
        });
      });

      describe('pick()', function () {
        let zPerson: OdCommand<any>;

        beforeEach(function () {
          zPerson = z
            .object({
              firstName: z.string(),
              lastName: z.string(),
            })
            .command('foo', 'bar');
        });

        it('should return a new OdCommand with the new shape', function () {
          const zLastname = zPerson.pick({lastName: true});
          expect(
            zLastname,
            'to satisfy',
            expect
              .it('to be an', OdCommand)
              .and('not to be', zPerson)
              .and('to satisfy', {
                _def: {odCommandOptions: {command: 'foo'}},
                description: 'bar',
                // TODO better ZodType equality check
                _odInnerType: {
                  shape: expect.it('to equal', {
                    lastName: zPerson.shape.lastName,
                  }),
                },
              }),
          );
        });
      });

      describe('omit()', function () {
        let zPerson: OdCommand<any>;

        beforeEach(function () {
          zPerson = z
            .object({
              firstName: z.string(),
              lastName: z.string(),
            })
            .command('foo', 'bar');
        });

        it('should return a new OdCommand with the new shape', function () {
          const zFirstname = zPerson.omit({lastName: true});
          expect(
            zFirstname,
            'to satisfy',
            expect
              .it('to be an', OdCommand)
              .and('not to be', zPerson)
              .and('to satisfy', {
                _def: {odCommandOptions: {command: 'foo'}},
                description: 'bar',
                // TODO better ZodType equality check
                _odInnerType: {
                  shape: expect.it('to equal', {
                    firstName: zPerson.shape.firstName,
                  }),
                },
              }),
          );
        });
      });
    });
  });
});
