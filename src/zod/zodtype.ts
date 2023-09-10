/**
 * Implementation of new methods grafted onto `zod`'s `ZodType` abstract class and its `ZodObject` subclass.
 *
 * See `zodtype-augment.ts` for the module augmentation itself.
 * @packageDocumentation
 */

/* eslint-disable no-prototype-builtins */
/* eslint-disable @typescript-eslint/no-unused-vars */

import type * as y from 'yargs';
import z from 'zod';
import {monkeypatch, unmonkeypatch} from '../monkey';
import {OdCommand} from './command';
import {OdType} from './od';
import {DynamicOdOptions} from './option';
export const kOd: unique symbol = Symbol('kOd');

/**
 * A list of `ZodType` subclasses which cannot be expressed within Yargs (i.e. _cannot be accepted on the command-line_).
 *
 * Over time, this list should narrow as we are able to use {@linkcode z.ZodType.transform transform()} to convert these types into something Yargs can handle.
 *
 * This is a _deny_ list instead of the converse because we need to monkeypatch `ZodType` itself for consistency. This is used in step two of the process:
 *
 * 1. Monkeypatch `ZodType`
 * 2. Monkeypatch our monkeypatch on each unsupported type to make all our functions throw.
 */
const UNSUPPORTED_ZODTYPES = [
  z.ZodBigInt,
  z.ZodDate,
  z.ZodUndefined,
  z.ZodFunction,
  z.ZodNaN,
  z.ZodLiteral,
  z.ZodNever,
  z.ZodTuple,
  z.ZodRecord,
  z.ZodMap,
  z.ZodSet,
  z.ZodSymbol,
  z.ZodNull,
  z.ZodPromise,
  z.ZodAny, // TODO: support
  z.ZodUnknown,
] as const;

function getYargsType<T extends z.ZodTypeAny>(
  schema: T,
): {type: y.Options['type']} | undefined {
  if (schema instanceof OdType) {
    return getYargsType(schema._odInnerType);
  }
  switch (schema._def?.typeName) {
    case z.ZodFirstPartyTypeKind.ZodBoolean:
      return {type: 'boolean'};
    case z.ZodFirstPartyTypeKind.ZodString:
    case z.ZodFirstPartyTypeKind.ZodEnum:
      return {type: 'string'};
    case z.ZodFirstPartyTypeKind.ZodNumber:
      return {type: 'number'};
    case z.ZodFirstPartyTypeKind.ZodArray:
      if (
        schema._def.innerType._def.typeName ===
        z.ZodFirstPartyTypeKind.ZodString
      ) {
        return {type: 'string'};
      }
  }
}

/**
 * This class' `prototype` is grafted onto {@linkcode z.ZodType} and represents
 * everything in the module augmentation of {@linkcode z.ZodType}.
 */
abstract class OdZodType {
  alias(this: z.ZodType, alias: string | string[]) {
    return this.option({alias});
  }

  global(this: z.ZodType) {
    return this.option({global: true});
  }

  hidden(this: z.ZodType) {
    return this.option({hidden: true});
  }

  defaultDescription(this: z.ZodType, defaultDescription: string) {
    return this.option({defaultDescription});
  }

  group(this: z.ZodType, group: string) {
    return this.option({group});
  }

  count(this: z.ZodType) {
    return this.option({count: true});
  }

  normalize(this: z.ZodType) {
    return this.option({normalize: true});
  }

  nargs(this: z.ZodType, nargs: number) {
    return this.option({nargs});
  }

  demandOption(this: z.ZodType) {
    return this.option({demandOption: true});
  }
  option(this: z.ZodType, config?: DynamicOdOptions) {
    return this instanceof OdType
      ? this._cloneWith(config)
      : new OdType({odOptions: {...config}, innerType: this});
  }
  _toYargsOptions(this: z.ZodType, strict: boolean): y.Options {
    if (this instanceof OdType) {
      // CAREFUL; demandOption can be overridden by the Def's `OdlawOptions`
      return {
        ...this._yargsType,
        demandOption: strict,
        ...this._def.odOptions,
        describe: this.description,
      };
    }
    return {
      ...this._yargsType,
      demandOption: strict,
      describe: this.description,
    };
  }

  /**
   * @todo Should we just return `undefined` if `this` is not a `ZodObject`?
   */
  _toYargsOptionsRecord(this: z.ZodType) {
    if (!(this instanceof z.ZodObject)) {
      throw new TypeError('Expected ZodObject');
    }
    const record: Record<string, y.Options> = {};
    for (const key of Object.keys(this._def.shape)) {
      record[key] = this.shape[key]._toYargsOptions(false);
    }
    return record;
  }
}

/**
 * Returns the equivalent Yargs type for a given `ZodType`.
 *
 * This cannot be a `get _yargsType` on the class because it _must_ be `configurable`.
 */
Object.defineProperties(OdZodType.prototype, {
  _yargsType: {
    get() {
      return getYargsType(this);
    },
    configurable: true,
    enumerable: false,
  },
});

/**
 * Monkeypatches Zod with yargs extensions
 */
export function register(zod: typeof z) {
  if (zod.ZodType.prototype[kOd]) {
    return zod;
  }

  monkeypatch(kOd, zod.ZodType.prototype, OdZodType.prototype);

  for (const ctor of UNSUPPORTED_ZODTYPES) {
    const unsupportedMethods = Object.entries(
      Object.getOwnPropertyDescriptors(OdZodType.prototype),
    ).map(([prop, descriptor]) => {
      function unsupported() {
        throw new TypeError(`Unsupported method: ${prop}()`);
      }
      // rewriting the function name is a nice-to-have for debugging
      Object.defineProperty(unsupported, 'name', {
        value: `ODLAW_UNSUPPORTED_${prop}`,
      });
      if (descriptor.value) {
        return [prop, unsupported];
      }
      return [prop, undefined];
    });

    monkeypatch(kOd, ctor.prototype, Object.fromEntries(unsupportedMethods));
  }

  monkeypatch(kOd, zod, {command: OdCommand.create});

  return zod;
}

/**
 * Removes the stuff this package put on `ZodType`.
 * @param zod
 * @returns
 */
export function unregister(zod: typeof z) {
  if (!zod.ZodType.prototype[kOd]) {
    return zod;
  }
  // 1. `_yargsType` is not enumerable, so we have to ask for it specifically
  // 2. likewise, `kOd` is not enumerable because it's a `Symbol`
  // for (const prop of [...Object.keys(OdProto), '_yargsType', kOd]) {
  //   delete proto[prop as keyof typeof OdProto];
  // }

  unmonkeypatch(kOd, zod.ZodType.prototype);
  for (const ctor of UNSUPPORTED_ZODTYPES) {
    unmonkeypatch(kOd, ctor.prototype);
  }

  unmonkeypatch(kOd, zod);

  return zod;
}
