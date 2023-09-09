/* eslint-disable no-prototype-builtins */
/* eslint-disable @typescript-eslint/no-unused-vars */

import type * as y from 'yargs';
import z from 'zod';
import {OdType} from './od';
import {DynamicOdOptions} from './option';
export const kOd: unique symbol = Symbol('kOd');

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

const propIndex = new WeakMap<object, object>();

function setProps<T extends object, U extends object>(obj: T, props: U): T & U {
  if (obj.hasOwnProperty(kOd)) {
    return obj as any;
  }
  const descriptorEntries: [
    name: PropertyKey,
    descriptor: PropertyDescriptor,
  ][] = [];
  for (const prop of [
    ...Object.getOwnPropertyNames(props),
    // ...Object.getOwnPropertySymbols(props),
  ]) {
    descriptorEntries.push([
      prop,
      {...Object.getOwnPropertyDescriptor(props, prop), configurable: true},
    ]);
  }
  const descriptors = Object.fromEntries(descriptorEntries);
  Object.defineProperties(obj, {
    ...descriptors,
    [kOd]: {value: true, enumerable: false, configurable: true},
  });
  propIndex.set(obj, descriptors);
  return obj as any;
}

function removeProps<T extends object>(obj: T): Exclude<T, keyof unknown> | T {
  if (!obj.hasOwnProperty(kOd)) {
    return obj as any;
  }
  const descriptors = propIndex.get(obj);
  if (!descriptors) {
    return obj;
  }
  for (const prop of Object.keys(descriptors)) {
    delete obj[prop as keyof T];
  }
  delete obj[kOd as keyof T];
  propIndex.delete(obj);

  return obj as any;
}

/**
 * Proto to graft onto `ZodType.prototype`
 */
const OdProto: ThisType<z.ZodType> = {
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
    return this instanceof OdType
      ? this._cloneWith(config)
      : new OdType({odOptions: {...config}, innerType: this});
  },

  _toYargsOptions(strict: boolean): y.Options {
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
  },

  /**
   * @todo Should we just return `undefined` if `this` is not a `ZodObject`?
   */
  _toYargsOptionsRecord() {
    if (!(this instanceof z.ZodObject)) {
      throw new TypeError('Expected ZodObject');
    }
    const record: Record<string, y.Options> = {};
    for (const key of Object.keys(this._def.shape)) {
      record[key] = this.shape[key]._toYargsOptions(false);
    }
    return record;
  },
};

Object.defineProperties(OdProto, {
  _yargsType: {
    get() {
      return getYargsType(this);
    },
    configurable: true,
    enumerable: false,
  },
});

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

  removeProps(zod.ZodType.prototype);
  for (const ctor of UNSUPPORTED) {
    removeProps(ctor.prototype);
  }

  return zod;
}

const UNSUPPORTED = [
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

/**
 * Monkeypatches Zod with yargs extensions
 */
export function register(zod: typeof z) {
  if (zod.ZodType.prototype[kOd]) {
    return zod;
  }

  setProps(zod.ZodType.prototype, OdProto);

  for (const ctor of UNSUPPORTED) {
    const unsupportedMethods = Object.keys(OdProto).map((prop) => {
      function unsupported() {
        throw new TypeError(`Unsupported method: ${prop}()`);
      }
      Object.defineProperty(unsupported, 'name', {
        value: `ODLAW_UNSUPPORTED_${prop}`,
      });
      return [prop, unsupported];
    });

    setProps(ctor.prototype, Object.fromEntries(unsupportedMethods));
  }

  // we want to set any properties _after_ the unsupported exceptions are added
  // so that the prop getter itself does not throw.
  // it doesn't work to assign a getter to the `OdProto` object; ostensibly
  // because it's not enumerable

  return zod;
}
