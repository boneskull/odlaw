/* eslint-disable no-use-before-define */
import {Argv, Options as YOptions} from 'yargs';
import z from 'zod';
import './zod';
export const kZodlaw: unique symbol = Symbol('kZodlaw');

/**
 * Instantiates a new Zod type with the `_def` which we have presumably updated
 * @internal
 */
function _newThis<T extends z.ZodTypeAny>(this: T) {
  const This = (this as any).constructor;
  return new This(this._def);
}

function isZodlawOptionType<T extends z.ZodTypeAny>(
  value: T,
): value is T & z.ZodlawOptionType {
  return (
    '_zodlaw' in value &&
    typeof value._zodlaw === 'function' &&
    'option' in value &&
    typeof value.option === 'function'
  );
}

function registerZodObject(zod: typeof z) {
  const ZodObjectProto = zod.ZodObject.prototype;

  // prevent re-registration
  if (ZodObjectProto[kZodlaw]) {
    return zod;
  }

  const ZodlawObjectProto: ThisType<z.AnyZodObject> = {
    _zodlaw(): z.ZodlawObject | undefined {
      return this._def.zodlawOptionsRecord;
    },

    options(config: Record<string, z.ZodlawOptions> = {}) {
      const zodlawOptionsRecord = this._zodlaw();
      this._def.zodlawOptionsRecord = zodlawOptionsRecord
        ? {...zodlawOptionsRecord, ...config}
        : config;

      return this._newThis();
    },

    /**
     * Configures a Yargs parser
     * @param yargs Yargs instance
     * @returns Configured Yargs instance
     */
    _configureParser(yargs: Argv) {
      /**
       * Any `ZodlawOptions` created via this `ZodObject` itself
       */
      const zlOptionsRecord = this._zodlaw();
      if (zlOptionsRecord) {
        // TODO: filter on supported types
        for (const key of this._getCached().keys) {
          const value = this.shape[key];
          const {description} = value._def ?? {};
          // if ZodlawOptions diverges from YOptions, this fail to compile
          const yOpts: YOptions = (zlOptionsRecord[key] ??= {});

          // TODO: breakout into its own function to pull in attributes from the zod schema
          // which don't exist in ZodlawOption
          if (description) {
            yOpts.describe ??= description;
          }

          // TODO: break this out into another function that assigns props from supported zod types
          if (isZodlawOptionType(value)) {
            const zlOpts = value._zodlaw();
            // thsi will break if ZodlawOptions diverges from YOptions
            Object.assign(yOpts, zlOpts) satisfies YOptions;
          }
        }
        return yargs.options(zlOptionsRecord);
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

type ZodlawKind = keyof typeof Registrations;

function assignZodlawOptionProto<T extends z.ZodlawOptionType>(proto: T) {
  const CommonProto: ThisType<T & z.AnyZodlaw> = {
    _zodlaw(): z.ZodlawOptions | undefined {
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
      const zodlawOptions = this._zodlaw();
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

export function register(zod: typeof z) {
  return Object.entries(Registrations)
    .filter(([kind]) => !zod[kind as ZodlawKind].prototype[kZodlaw])
    .reduce((zod, [, register]) => {
      return register(zod);
    }, zod);
}
