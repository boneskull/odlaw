/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-use-before-define */
import type * as yargs from 'yargs';
import {ZodlawOptions, z} from 'zod';
import './zod';
export const kZodlaw: unique symbol = Symbol('kZodlaw');

/**
 * Monkeypatches Zod with yargs extensions
 */
export function register(zod: typeof z) {
  const proto = zod.ZodType.prototype;

  if (proto[kZodlaw]) {
    return zod;
  }

  const ZodlawProto = <ThisType<z.ZodTypeAny>>{
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

      return new (this.constructor as any)(this._def);
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
  };

  Object.assign(proto, ZodlawProto);

  /**
   * @remarks Things that didn't work include:
   * 1. Creating a `Proxy` and assigning it to a prop on `zod`; the exports are
   *    defined via `Object.defineProperty` and are not configurable.
   * 2. Creating a `Proxy` or wrapper around the static `create()` function of
   *    the various classes; this works _sometimes_, but `create()` is not
   *    guaranteed to be called. The only thing we can rely on is the
   *    constructor.
   * 3. Deriving the type from the class itself. {@linkcode z.ZodType._input} is
   *    _not_ a real value; this is a clever trick. It's a way to "pin" the
   *    expected input type to the instance; the `Input` type argument of a
   *    `ZodType` is then always available as `ZodType['_input']`; this saves
   *    needing to pass the type argument around everywhere. Or--at
   *    least--that's what I _think_ the intent is. Since it's not a real value,
   *    we can't use it at runtime.
   * @param ctor Subclass of {@linkcode z.ZodType}
   * @param type Yargs option type
   */
  function injectZodlawOptions<T extends new (...args: any[]) => any>(
    ctor: T,
    type: yargs.Options['type'],
  ) {
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

  function injectUnsupported<T extends new (...args: any[]) => any>(ctor: T) {
    abstract class UnsupportedZodlawType<
      Output = any,
      Def extends z.ZodTypeDef = z.ZodTypeDef,
      Input = Output,
    > extends z.ZodType<Output, Def, Input> {}

    for (const prop of Object.keys(ZodlawProto)) {
      ctor.prototype[prop] = function () {
        throw new TypeError(`Unsupported method: ${prop}()`);
      };
    }

    Object.setPrototypeOf(ctor, UnsupportedZodlawType);
  }

  injectZodlawOptions(zod.ZodBoolean, 'boolean');
  injectZodlawOptions(zod.ZodString, 'string');
  injectZodlawOptions(zod.ZodNumber, 'number');
  injectZodlawOptions(zod.ZodArray, 'array');
  injectZodlawOptions(zod.ZodEnum, 'string');
  // TODO
  // injectZodlawOptions(zod.ZodUnion, ?)
  // injectZodlawOptions(zod.ZodDiscriminatedUnion, ?)
  // injectZodlawOptions(zod.ZodIntersection, ?)
  // injectZodlawOptions(zod.ZodEffects, ?)

  // TODO: strip options only from zod.ZodObject

  injectUnsupported(zod.ZodBigInt);
  injectUnsupported(zod.ZodDate);
  injectUnsupported(zod.ZodUndefined);
  injectUnsupported(zod.ZodFunction);
  injectUnsupported(zod.ZodNaN);
  injectUnsupported(zod.ZodLiteral);
  injectUnsupported(zod.ZodNever);
  injectUnsupported(zod.ZodTuple);
  injectUnsupported(zod.ZodRecord);
  injectUnsupported(zod.ZodMap);
  injectUnsupported(zod.ZodSet);
  injectUnsupported(zod.ZodSymbol);
  injectUnsupported(zod.ZodNull);
  injectUnsupported(zod.ZodPromise);
  injectUnsupported(zod.ZodAny);
  injectUnsupported(zod.ZodUnknown);

  return zod;
}
