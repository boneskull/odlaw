/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-use-before-define */
import type * as yargs from 'yargs';
import {z} from 'zod';
import {DynamicOdOptions} from './option';
export const kOd: unique symbol = Symbol('kOd');

/**
 * Monkeypatches Zod with yargs extensions
 */
export function register(zod: typeof z) {
  const proto = zod.ZodType.prototype;

  if (proto[kOd]) {
    return zod;
  }

  /**
   * Proto to graft onto `ZodType.prototype`
   */
  const OdProto = <z.ZodTypeAny>{
    [kOd]: true,

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

    option(config?: DynamicOdOptions) {
      const odOptions = this._def.odOptions;
      this._def.odOptions = odOptions
        ? {
            ...odOptions,
            ...config,
          }
        : config;

      return new (this.constructor as any)(this._def);
    },

    _toYargsOptions(strict: boolean): yargs.Options {
      return {
        ...this._def.odOptions,
        demandOption: strict,
        describe: this._def.description ?? this._def.odOptions?.describe,
      };
    },

    _toYargsOptionsRecord() {
      if (!(this instanceof z.ZodObject)) {
        throw new TypeError('Expected ZodObject');
      }
      const record: Record<string, yargs.Options> = {};
      for (const key of Object.keys(this._def.shape)) {
        record[key] = this.shape[key]._toYargsOptions(false);
      }
      return record;
    },
  };

  Object.assign(proto, OdProto);

  // /**
  //  * @remarks Things that didn't work include:
  //  * 1. Creating a `Proxy` and assigning it to a prop on `zod`; the exports are
  //  *    defined via `Object.defineProperty` and are not configurable.
  //  * 2. Creating a `Proxy` or wrapper around the static `create()` function of
  //  *    the various classes; this works _sometimes_, but `create()` is not
  //  *    guaranteed to be called. The only thing we can rely on is the
  //  *    constructor.
  //  * 3. Deriving the type from the class itself. {@linkcode z.ZodType._input} is
  //  *    _not_ a real value; this is a clever trick. It's a way to "pin" the
  //  *    expected input type to the instance; the `Input` type argument of a
  //  *    `ZodType` is then always available as `ZodType['_input']`; this saves
  //  *    needing to pass the type argument around everywhere. Or--at
  //  *    least--that's what I _think_ the intent is. Since it's not a real value,
  //  *    we can't use it at runtime.
  //  * @param ctor Subclass of {@linkcode z.ZodType}
  //  * @param type Yargs option type
  //  */
  // function injectOdOptions<T extends new (...args: any[]) => any>(
  //   ctor: T,
  //   type: yargs.Options['type'],
  // ) {
  //   abstract class OdType<
  //     Output = any,
  //     Def extends z.ZodTypeDef = z.ZodTypeDef,
  //     Input = Output,
  //   > extends z.ZodType<Output, Def, Input> {
  //     constructor(def: Def) {
  //       super({...def, odOptions: {...def.odOptions, type}});
  //     }
  //   }

  //   Object.setPrototypeOf(ctor, OdType);
  // }

  function injectUnsupported<T extends new (...args: any[]) => any>(ctor: T) {
    abstract class UnsupportedOdType<
      Output = any,
      Def extends z.ZodTypeDef = z.ZodTypeDef,
      Input = Output,
    > extends z.ZodType<Output, Def, Input> {}

    for (const prop of Object.keys(OdProto)) {
      ctor.prototype[prop] = function () {
        throw new TypeError(`Unsupported method: ${prop}()`);
      };
    }

    Object.setPrototypeOf(ctor, UnsupportedOdType);
  }

  // injectOdOptions(zod.ZodBoolean, 'boolean');
  // injectOdOptions(zod.ZodString, 'string');
  // injectOdOptions(zod.ZodNumber, 'number');
  // injectOdOptions(zod.ZodArray, 'array');
  // injectOdOptions(zod.ZodEnum, 'string');
  // TODO
  // injectOdOptions(zod.ZodUnion, ?)
  // injectOdOptions(zod.ZodDiscriminatedUnion, ?)
  // injectOdOptions(zod.ZodIntersection, ?)
  // injectOdOptions(zod.ZodEffects, ?)

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
