/* eslint-disable no-use-before-define */
import {Argv} from 'yargs';
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
          const zodObjZodlawOpts = (zodlawOpts[key] ??= {});

          // TODO: breakout into its own function to pull in attributes from the zod schema
          // which don't exist in ZodlawOption
          if (description) {
            zodObjZodlawOpts.describe ??= description;
          }

          // TODO: break this out into another function that assigns props from supported zod types
          if (isZodBoolean(value)) {
            const zodlawOpt = value.zodlaw();
            Object.assign(zodObjZodlawOpts, zodlawOpt);
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

function registerZodBoolean(zod: typeof z) {
  const ZodBooleanProto = zod.ZodBoolean.prototype;

  if (ZodBooleanProto[kZodlaw]) {
    return zod;
  }

  const ZodlawBooleanProto: ThisType<z.ZodBoolean> = {
    zodlaw(): z.ZodlawOptions | undefined {
      return this._def.zodlawOptions;
    },

    option(config?: z.ZodlawOptions) {
      const zodlawOptions = this.zodlaw();
      this._def.zodlawOptions = zodlawOptions
        ? {...zodlawOptions, ...config}
        : config;

      return this._newThis();
    },

    _newThis,

    [kZodlaw]: true,
  };

  Object.assign(ZodBooleanProto, ZodlawBooleanProto);

  return zod;
}

export function register(zod: typeof z) {
  zod = registerZodObject(zod);
  zod = registerZodBoolean(zod);
  return zod;
}
