/* eslint-disable no-use-before-define */
import {Argv, Options as YOptions} from 'yargs';
import z from 'zod';
import './zod';
export const kZodlaw: unique symbol = Symbol('kZodlaw');

/**
 * Type guard for {@linkcode z.ZodBoolean}
 * @param value Some Zod type
 * @returns `true` if `value` is a `ZodBoolean`
 */
function isZodBoolean(value: z.ZodTypeAny): value is z.ZodBoolean {
  return (
    value instanceof z.ZodBoolean ||
    value._def?.typeName === z.ZodFirstPartyTypeKind.ZodBoolean
  );
}

/**
 * Instantiates a new Zod type with the `_def` which we have presumably updated
 * @internal
 */
function _newThis<T extends z.ZodTypeAny>(this: T) {
  const This = (this as any).constructor;
  return new This(this._def);
}

function registerZodObject(zod: typeof z) {
  const ZodObjectProto = zod.ZodObject.prototype;

  // prevent re-registration
  if (ZodObjectProto[kZodlaw]) {
    return zod;
  }

  const ZodlawObjectProto: ThisType<z.AnyZodObject> = {
    zodlaw(): z.ZodlawObject | undefined {
      return this._def.zodlawOptionsRecord;
    },

    options(config: Record<string, z.ZodlawOptions> = {}) {
      const zodlawOptionsRecord = this.zodlaw();
      this._def.zodlawOptionsRecord = zodlawOptionsRecord
        ? {...zodlawOptionsRecord, ...config}
        : config;

      return this._newThis();
    },

    createParser(yargs: Argv) {
      /**
       * Any `ZodlawOptions` created via this `ZodObject` itself
       */
      const zodlawOpts = this.zodlaw();
      if (zodlawOpts) {
        // TODO: filter on supported types
        for (const key of this._getCached().keys) {
          const value = this.shape[key];
          const {description} = value._def ?? {};
          // if ZodlawOptions diverges from YOptions, this fail to compile
          const yOpts: YOptions = (zodlawOpts[key] ??= {});

          // TODO: breakout into its own function to pull in attributes from the zod schema
          // which don't exist in ZodlawOption
          if (description) {
            yOpts.describe ??= description;
          }

          // TODO: break this out into another function that assigns props from supported zod types
          if (isZodBoolean(value)) {
            const zodlawOpt = value.zodlaw();
            Object.assign(yOpts, zodlawOpt);
          }
        }
        return yargs.options(zodlawOpts);
      }
      return yargs;
    },

    _newThis,

    [kZodlaw]: true,
  };

  Object.assign(ZodObjectProto, ZodlawObjectProto);

  return zod;
}

const Registrations = {
  [z.ZodFirstPartyTypeKind.ZodBoolean]: registerZodBoolean,
  [z.ZodFirstPartyTypeKind.ZodString]: registerZodString,
  // [z.ZodFirstPartyTypeKind.ZodNumber]: registerZodNumber,
  // [z.ZodFirstPartyTypeKind.ZodArray]: registerZodArray,
  [z.ZodFirstPartyTypeKind.ZodObject]: registerZodObject,
};

function assignZodlawOptionProto<T extends z.ZodlawOptionType>(proto: T) {
  const CommonProto: ThisType<T & z.AnyZodlaw> = {
    zodlaw(): z.ZodlawOptions | undefined {
      return this._def.zodlawOptions;
    },

    global() {
      return this.option({global: true});
    },

    hidden() {
      return this.option({hidden: true});
    },

    defaultDescription(defaultDescription = '') {
      return this.option({defaultDescription});
    },

    group(name: string) {
      return this.option({group: name});
    },

    option(config?: z.ZodlawOptions) {
      const zodlawOptions = this.zodlaw();
      this._def.zodlawOptions = zodlawOptions
        ? {...zodlawOptions, ...config}
        : config;

      return this._newThis();
    },

    count() {
      return this.option({count: true});
    },

    _newThis,

    [kZodlaw]: true,
  };

  return Object.assign(proto, CommonProto);
}

function registerZodBoolean(zod: typeof z) {
  const ZodBooleanProto = zod.ZodBoolean.prototype;

  if (ZodBooleanProto[kZodlaw]) {
    return zod;
  }

  /**
   * methods specific to `ZodBoolean`
   */
  const ZodlawBooleanProto: ThisType<z.ZodBoolean> = {
    count() {
      return this.option({count: true});
    },
  };

  Object.assign(assignZodlawOptionProto(ZodBooleanProto), ZodlawBooleanProto);

  return zod;
}

function registerZodString(zod: typeof z) {
  const ZodStringProto = zod.ZodString.prototype;

  if (ZodStringProto[kZodlaw]) {
    return zod;
  }

  /**
   * methods specific to `ZodString`
   */
  const ZodlawStringProto: ThisType<z.ZodBoolean> = {
    normalize() {
      return this.option({normalize: true});
    },
  };

  Object.assign(assignZodlawOptionProto(ZodStringProto), ZodlawStringProto);

  return zod;
}

function registryGate(
  zod: typeof z,
  kind: keyof typeof Registrations,
  register: (zod: typeof z) => typeof z,
) {
  const proto = zod[kind].prototype;
  // if (kZodlaw in proto) {
  //   return zod;
  // }

  proto[kZodlaw] = true;

  return register(zod);
}

export function register(zod: typeof z) {
  for (const [kind, register] of Object.entries(Registrations)) {
    zod = registryGate(zod, kind as keyof typeof Registrations, register);
  }
  return zod;
}
