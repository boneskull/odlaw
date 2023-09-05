import unexpected from 'unexpected';
import yargs from 'yargs';
import zod from 'zod';
import {register} from '../../src/zodlaw';

const expect = unexpected.clone();
const z = register(zod);

describe('zodlaw', function () {
  describe('option', function () {
    describe('boolean', function () {
      it('should not throw', function () {
        expect(() => z.boolean().option({}), 'not to throw');
      });
    });
  });

  describe('_toYargsOptions()', function () {
    it('should return a parser that parses args', function () {
      const schema = z.object({
        foo: z.boolean().describe('pigs').option({
          defaultDescription: 'cows',
        }),
      });
      expect(schema.shape.foo._toYargsOptions(false), 'to satisfy', {
        type: 'boolean',
        describe: 'pigs',
        defaultDescription: 'cows',
      });
    });

    describe('when called on an unsupported type', function () {
      it('should throw', function () {
        expect(() => z.date()._toYargsOptions(true), 'to throw a', TypeError);
      });
    });
  });

  describe('_toYargs()', function () {
    it('should not throw', function () {
      expect(
        () =>
          z
            .object({
              foo: z.boolean(),
            })
            ._toYargs(yargs),
        'not to throw',
      );
    });

    describe('createParser()', function () {
      const schema = z.object({
        foo: z.string().describe('One foo only'),
      });

      it('should return a parser that parses args', function () {
        const result = schema
          ._toYargs(yargs(['--foo', 'bar', 'baz']))
          .parseSync();
        expect(result, 'to satisfy', {_: ['baz'], foo: 'bar'});
      });

      it('should pull description out of zod', async function () {
        const result = await schema
          ._toYargs(yargs(['--foo', 'bar', 'baz']))
          .getHelp();
        expect(result, 'to match', /--foo\s.+One foo only/);
      });
    });
  });
});
