import unexpected from 'unexpected';
import yargs from 'yargs/yargs';
import z from 'zod';
import {register} from '../../src/zodlaw';
const expect = unexpected.clone();
register(z);

describe('zodlaw', function () {
  describe('option', function () {
    describe('boolean', function () {
      it('should not throw', function () {
        expect(() => z.boolean().option({}), 'not to throw');
      });
    });
  });

  describe('createParser()', function () {
    it('should return a parser that parses args', async function () {
      const schema = z
        .object({
          foo: z
            .boolean()
            .describe('Some flag')
            .option({defaultDescription: 'foo means stuff'}),
        })
        .options()
        .strict();
      await expect(
        schema.createParser(yargs(['--foo', 'bar', 'baz'])).getHelp(),
        'to be fulfilled with value satisfying',
        /foo means stuff/,
      );

      // expect(result, 'to satisfy', {_: ['baz'], foo: 'bar'});
    });
  });

  describe('options', function () {
    it('should not throw', function () {
      expect(
        () =>
          z
            .object({
              foo: z.boolean(),
            })
            .options({
              foo: {
                hidden: true,
              },
            })
            .strict(),
        'not to throw',
      );
    });

    describe('createParser()', function () {
      const schema = z
        .object({
          foo: z.string().describe('One foo only'),
        })
        .options({
          foo: {
            nargs: 1,
          },
        })
        .strict();

      it('should return a parser that parses args', function () {
        const result = schema
          .createParser(yargs(['--foo', 'bar', 'baz']))
          .parseSync();
        expect(result, 'to satisfy', {_: ['baz'], foo: 'bar'});
      });

      it('should pull description out of zod', async function () {
        const result = await schema
          .createParser(yargs(['--foo', 'bar', 'baz']))
          .getHelp();
        expect(result, 'to match', /--foo\s.+One foo only/);
      });
    });
  });
});