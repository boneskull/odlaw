import path from 'node:path';
import unexpected from 'unexpected';
import {z} from 'zod';
import {
  loadConfig,
  loadConfigSync,
  resetCache,
  searchConfig,
  searchConfigSync,
} from '../src/config';

const expect = unexpected.clone();

describe('config', function () {
  const schema = z
    .object({
      foo: z.string(),
      bar: z.number(),
      baz: z.boolean().default(true),
    })
    .strict();

  beforeEach(function () {
    resetCache();
  });

  describe('when a config file is present and valid', function () {
    const filepath = require.resolve('./fixture/config/.goodrc.json');
    const expected = {
      filepath,
      config: {
        foo: 'baz',
        bar: 42,
        baz: true,
      },
    };

    describe('loadConfig()', function () {
      it('should load and validate a config file', async function () {
        await expect(
          loadConfig('good', filepath, schema),
          'to be fulfilled with',
          expected,
        );
      });

      describe('with a pre transform', function () {
        it('should load and validate a config file', async function () {
          await expect(
            loadConfig('good', filepath, schema, {
              prepare: async (result) => {
                return result === null
                  ? null
                  : {
                      ...result,
                      config: {
                        ...result.config,
                        foo: result.config.foo.toUpperCase(),
                      },
                    };
              },
            }),
            'to be fulfilled with',
            {...expected, config: {...expected.config, foo: 'BAZ'}},
          );
        });

        describe('when the pre transform returns an invalid object', function () {
          it('should reject', async function () {
            await expect(
              loadConfig('good', filepath, schema, {
                prepare: async (result) => {
                  return result === null
                    ? result
                    : {
                        ...result,
                        config: {
                          ...result.config,
                          spam: 42,
                        },
                      };
                },
              }),
              'to be rejected',
            );
          });

          describe('when using safe mode', function () {
            it('should report errors but not reject', async function () {
              await expect(
                loadConfig('good', filepath, schema, {
                  safe: true,
                  prepare: (result) => {
                    return result === null
                      ? null
                      : {
                          ...result,
                          config: {
                            ...result.config,
                            spam: 42,
                          },
                        };
                  },
                }),
                'to be fulfilled with value satisfying',
                {error: expect.it('to be a', z.ZodError)},
              );
            });
          });
        });
      });
    });

    describe('loadConfigSync()', function () {
      it('should load and validate a config file', function () {
        expect(loadConfigSync('good', filepath, schema), 'to equal', expected);
      });

      describe('with a pre transform', function () {
        it('should load and validate a config file', function () {
          expect(
            loadConfigSync('good', filepath, schema, {
              prepare: (result) => {
                return result === null
                  ? null
                  : {
                      ...result,
                      config: {
                        ...result.config,
                        foo: result.config.foo.toUpperCase(),
                      },
                    };
              },
            }),
            'to equal',
            {...expected, config: {...expected.config, foo: 'BAZ'}},
          );
        });

        describe('when the pre transform returns an invalid object', function () {
          it('should throw', function () {
            expect(
              () =>
                loadConfigSync('good', filepath, schema, {
                  prepare: (result) => {
                    return result === null
                      ? null
                      : {
                          ...result,
                          config: {
                            ...result.config,
                            spam: 42,
                          },
                        };
                  },
                }),
              'to throw a',
              z.ZodError,
            );
          });

          describe('when using safe mode', function () {
            it('should report errors but not throw', function () {
              expect(
                loadConfigSync('good', filepath, schema, {
                  safe: true,
                  prepare: (result) => {
                    return result === null
                      ? null
                      : {
                          ...result,
                          config: {
                            ...result.config,
                            spam: 42,
                          },
                        };
                  },
                }),
                'to satisfy',
                {error: expect.it('to be a', z.ZodError)},
              );
            });
          });
        });

        describe('when the pre transform is async', function () {
          it('should throw', function () {
            expect(
              () =>
                loadConfigSync('good', filepath, schema, {
                  // @ts-expect-error wrong type
                  prepare: async (result) => {
                    return result === null
                      ? null
                      : {
                          ...result,
                          config: {
                            ...result.config,
                            foo: result.config.foo.toUpperCase(),
                          },
                        };
                  },
                }),
              'to throw a',
              TypeError,
            );
          });
        });
      });

      describe('when a loader is async', function () {
        it('should throw', function () {
          expect(
            () =>
              loadConfigSync('good', filepath, schema, {
                loaders: {'.json': async () => expected.config},
              }),
            'to throw a',
            TypeError,
          );
        });
      });

      describe('when a loader returns a Promise', function () {
        it('should throw', function () {
          expect(
            () =>
              loadConfigSync('good', filepath, schema, {
                loaders: {'.json': () => Promise.resolve(expected.config)},
              }),
            'to throw a',
            TypeError,
          );
        });
      });

      describe('when a loader is sync', function () {
        it('should not throw', function () {
          expect(
            () =>
              loadConfigSync('good', filepath, schema, {
                loaders: {'.json': () => expected.config},
              }),
            'not to throw',
          );
        });
      });
    });

    describe('searchConfig()', function () {
      it('should find, load and validate a config file', async function () {
        await expect(
          searchConfig('good', schema, {cwd: path.dirname(filepath)}),
          'to be fulfilled with',
          expected,
        );
      });
    });

    describe('searchConfigSync()', function () {
      it('should find, load and validate a config file', async function () {
        expect(
          searchConfigSync('good', schema, {cwd: path.dirname(filepath)}),
          'to equal',
          expected,
        );
      });
    });
  });
});
