/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-use-before-define */
import type * as yargs from 'yargs';
import {ZodlawOptions, z} from 'zod';
import './zod';
export const kZodlaw: unique symbol = Symbol('kZodlaw');

/**
 * Utilties for the patchers
 * @internal
 */
const PatchUtils = {
  getSource(schema: z.ZodTypeAny): z.ZodTypeAny {
    if (schema instanceof z.ZodEffects) {
      return schema.sourceType();
    }
    if (schema instanceof z.ZodDefault) {
      return PatchUtils.getSource(schema._def.innerType);
    }
    if (schema instanceof z.ZodBranded) {
      return PatchUtils.getSource(schema._def.type);
    }
    return schema;
  },

  clone<Z extends z.ZodTypeAny>(schema: Z): Z {
    return new (schema.constructor as any)(schema._def);
  },
};

export function register(zod: typeof z) {
  const proto = zod.ZodType.prototype;

  if (proto[kZodlaw]) {
    return zod;
  }

  Object.assign(proto, <ThisType<z.ZodTypeAny>>{
    [kZodlaw]: true,

    alias(alias: string | string[]) {
      return this.option({alias});
    },

    global() {
      return this.option({global: true});
    },

    hidden() {
      return this.option({hidden: true});
    },

    defaultDescription(defaultDescription: string) {
      return this.option({defaultDescription});
    },

    group(group: string) {
      return this.option({group});
    },

    count() {
      return this.option({count: true});
    },

    normalize() {
      return this.option({normalize: true});
    },

    nargs(nargs: number) {
      return this.option({nargs});
    },

    demandOption() {
      return this.option({demandOption: true});
    },

    option(config?: ZodlawOptions) {
      const zodlawOptions = this._def.zodlawOptions;
      this._def.zodlawOptions = zodlawOptions
        ? {
            ...zodlawOptions,
            ...config,
          }
        : config;

      return PatchUtils.clone(this);
    },

    _toYargsOptions(strict: boolean): yargs.Options {
      return {
        ...this._def.zodlawOptions,
        demandOption: strict,
        describe: this._def.description ?? this._def.zodlawOptions?.describe,
      };
    },

    _toYargs<Y>(argv: yargs.Argv<Y>) {
      if (!(this instanceof z.ZodObject)) {
        throw new TypeError('Expected ZodObject');
      }

      // /**
      //  * Any `ZodlawOptions` created via this `ZodObject` itself
      //  */
      // const zlOptionsRecord = this._def.zodlawOptionsRecord;

      const strict =
        'unknownKeys' in this._def && this._def.unknownKeys === 'strict';

      const yOpts = Object.entries(this.shape).reduce(
        (zlOptionsRecord, [key, value]) => {
          zlOptionsRecord[key] = (value as z.ZodTypeAny)._toYargsOptions(
            strict,
          );
          return zlOptionsRecord;
        },
        {} as Record<string, yargs.Options>,
      );

      return argv.options(yOpts);
    },
  });

  /**
   * @remarks Things that didn't work include:
   * 1. Creating a `Proxy` and assigning it to `zod`; the exports are defined via `Object.defineProperty` and are not configurable.
   * 2. Creating a `Proxy` or wrapper around the static `create()` function of the various classes; this works _sometimes_, but `create()` is not guaranteed to be called. The only thing we can rely on is the constructor.
   * 3. Deriving the type from the class itself. {@linkcode z.ZodType._input} is _not_ a real value, which is a clever trick. It's a way to "pin" the expected input type to the class itself; the `Input` type argument of a `ZodType` is then always available as `ZodType['_input']`; this saves needing to pass the type argument around everywhere. Or--at least--that's what I _think_ the intent is.
   * @param ctor Subclass of {@linkcode z.ZodType}
   * @param type Yargs option type
   */
  function injectZodlawOptions<T>(ctor: T, type: yargs.Options['type']) {
    abstract class ZodlawType<
      Output = any,
      Def extends z.ZodTypeDef = z.ZodTypeDef,
      Input = Output,
    > extends z.ZodType<Output, Def, Input> {
      constructor(def: Def) {
        super({...def, zodlawOptions: {...def.zodlawOptions, type}});
      }
    }

    Object.setPrototypeOf(ctor, ZodlawType);
  }

  injectZodlawOptions(zod.ZodBoolean, 'boolean');
  injectZodlawOptions(zod.ZodString, 'string');
  injectZodlawOptions(zod.ZodNumber, 'number');
  injectZodlawOptions(zod.ZodArray, 'array');
  injectZodlawOptions(zod.ZodEnum, 'string');

  return zod;
}
