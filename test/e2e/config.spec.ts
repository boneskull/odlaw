import path from 'node:path';
import unexpected from 'unexpected';
import {z} from 'zod';
import {loadConfig, searchConfig} from '../../src/config';

const expect = unexpected.clone();

describe('config', () => {
  describe('loadConfig()', () => {
    it('should load and validate a config file', async () => {
      const schema = z.object({
        foo: z.string(),
        bar: z.number(),
        baz: z.boolean().default(true),
      });
      const filepath = require.resolve('./fixture/config/.goodrc.json');
      await expect(
        loadConfig('good', filepath, schema),
        'to be fulfilled with',
        {
          filepath,
          config: {
            foo: 'baz',
            bar: 42,
            baz: true,
          },
        },
      );
    });
  });

  describe('searchConfig()', () => {
    it('should find, load and validate a config file', async () => {
      const schema = z.object({
        foo: z.string(),
        bar: z.number(),
        baz: z.boolean().default(true),
      });
      const filepath = require.resolve('./fixture/config/.goodrc.json');
      await expect(
        searchConfig('good', schema, {cwd: path.dirname(filepath)}),
        'to be fulfilled with',
        {
          filepath,
          config: {
            foo: 'baz',
            bar: 42,
            baz: true,
          },
        },
      );
    });
  });
});
