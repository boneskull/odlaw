/* eslint-disable no-use-before-define */
import {Argv, Options as YOptions} from 'yargs';
import z from 'zod';
import './zod';
export const kZodlaw: unique symbol = Symbol('kZodlaw');

const Monkeypatchers = {
  [z.ZodFirstPartyTypeKind.ZodBoolean]: patchZodBoolean,
  [z.ZodFirstPartyTypeKind.ZodString]: patchZodString,
  [z.ZodFirstPartyTypeKind.ZodNumber]: patchZodNumber,
  [z.ZodFirstPartyTypeKind.ZodEnum]: patchZodEnum,
  [z.ZodFirstPartyTypeKind.ZodArray]: patchZodArray,
  [z.ZodFirstPartyTypeKind.ZodObject]: patchZodObject,
};

type ZodlawKind = keyof typeof Monkeypatchers;

function isZodEffects(schema: any): schema is z.ZodEffects<z.ZodTypeAny> {
  return schema?._def?.typeName === z.ZodFirstPartyTypeKind.ZodEffects;
}

function isZodDefault(schema: any): schema is z.ZodDefault<z.ZodTypeAny> {
  return schema?._def?.typeName === z.ZodFirstPartyTypeKind.ZodDefault;
}

function isZodBranded(schema: any): schema is z.ZodBranded<any, any> {
  return schema?._def?.typeName === z.ZodFirstPartyTypeKind.ZodBranded;
}

function isZodArray(schema: any): schema is z.ZodArray<z.ZodTypeAny> {
  return schema?._def?.typeName === z.ZodFirstPartyTypeKind.ZodArray;
}

/**
 * Utilties for the patchers
 * @internal
 */
const PatchUtils = {
  isZodEffects(schema: z.ZodTypeAny): schema is z.ZodEffects<z.ZodTypeAny> {
    return schema._def.typeName === z.ZodFirstPartyTypeKind.ZodEffects;
  },

  getSource(schema: z.ZodTypeAny): z.ZodTypeAny {
    if (isZodEffects(schema)) {
      return schema.sourceType();
    }
    if (isZodDefault(schema)) {
      return PatchUtils.getSource(schema._def.innerType);
    }
    if (isZodBranded(schema)) {
      return PatchUtils.getSource(schema._def.type);
    }
    if (isZodArray(schema)) {
      return PatchUtils.getSource(schema.element);
    }
    return schema;
  },

  clone<Z extends z.ZodTypeAny>(schema: Z): Z {
    return new (schema.constructor as any)(schema._def);
  },

  /**
   * Type guard for {@linkcode ZodlawOptionType}
   * @param value Some Zod Type
   * @returns `true` if the `ZodType` is also a `ZodlawOptionType`
   */
  isZodlawOptionType<T extends z.ZodTypeAny>(
    value: T,
  ): value is T & z.ZodlawOptionType {
    return (
      '_zodlaw' in value &&
      typeof value._zodlaw === 'function' &&
      'option' in value &&
      typeof value.option === 'function'
    );
  },

  /**
   * This is fairly defensive, but I wanted to be explicit about what we're passing around.
   * @param zlOpts - {@linkcode ZodlawOptions}
   * @param classSpecificOpts - Extra config that is specific to the `ZodType`
   * @returns Options for `yargs.option()`
   */
  zlOptsToYOpts(
    zlOpts: z.ZodlawOptions,
    classSpecificOpts: Partial<YOptions>,
  ): YOptions {
    return {
      alias: zlOpts.alias,
      count: zlOpts.count,
      defaultDescription: zlOpts.defaultDescription,
      deprecated: zlOpts.deprecated,
      global: zlOpts.global,
      group: zlOpts.group,
      hidden: zlOpts.hidden,
      nargs: zlOpts.nargs,
      ...classSpecificOpts,
    };
  },

  assignZodlawOptionProto<T extends z.ZodlawOptionType & z.ZodTypeAny>(
    proto: T,
  ) {
    const CommonProto: ThisType<T> = {
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

      group(group: string) {
        return this.option({group});
      },

      option(config?: z.ZodlawOptions) {
        const zodlawOptions = this._zodlaw();
        this._def.zodlawOptions = zodlawOptions
          ? {...zodlawOptions, ...config}
          : config;

        return PatchUtils.clone(this);
      },

      alias(alias: string | string[]) {
        return this.option({alias});
      },

      [kZodlaw]: true,
    };

    return Object.assign(proto, CommonProto);
  },
};

function patchZodEnum(zod: typeof z) {
  const ZodEnumProto = zod.ZodEnum.prototype;

  if (ZodEnumProto[kZodlaw]) {
    return zod;
  }

  const ZodlawEnumProto: ThisType<z.ZodEnum<any>> = {
    _configureOptions(strict?: boolean) {
      return PatchUtils.zlOptsToYOpts(this._zodlaw() ?? {}, {
        demandOption: strict,
        describe: this._def.description,
        choices: this._def.values,
      });
    },
  };

  Object.assign(
    PatchUtils.assignZodlawOptionProto(ZodEnumProto),
    ZodlawEnumProto,
  );

  return zod;
}

function patchZodObject(zod: typeof z) {
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

      return PatchUtils.clone(this);
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
        // todo: allow `.strict()` on `AnyZodlawType`
        const strict =
          'unknownKeys' in this._def && this._def.unknownKeys === 'strict';
        return yargs.options(
          Object.entries(this.shape)
            .filter(([, value]) =>
              PatchUtils.isZodlawOptionType(value as z.ZodTypeAny),
            )
            .reduce(
              (zlOptionsRecord, [key, value]) => ({
                ...zlOptionsRecord,

                [key]: {
                  ...zlOptionsRecord[key],
                  ...(value as z.ZodlawOptionType)._configureOptions(strict),
                },
              }),
              zlOptionsRecord,
            ),
        );
      }
      return yargs;
    },

    [kZodlaw]: true,
  };

  Object.assign(ZodObjectProto, ZodlawObjectProto);

  return zod;
}

function patchZodBoolean(zod: typeof z) {
  const ZodBooleanProto = zod.ZodBoolean.prototype;

  /**
   * method implementations specific to `ZodBoolean`
   */
  const ZodlawBooleanProto: ThisType<z.ZodBoolean> = {
    count() {
      return this.option({count: true});
    },

    _configureOptions(strict?: boolean) {
      return PatchUtils.zlOptsToYOpts(this._zodlaw() ?? {}, {
        demandOption: strict,
        describe: this._def.description,
        type: 'boolean',
      });
    },
  };

  Object.assign(
    PatchUtils.assignZodlawOptionProto(ZodBooleanProto),
    ZodlawBooleanProto,
  );

  return zod;
}

function patchZodString(zod: typeof z) {
  const ZodStringProto = zod.ZodString.prototype;

  /**
   * method implementations specific to `ZodString`
   */
  const ZodlawStringProto: ThisType<z.ZodString> = {
    normalize() {
      return this.option({normalize: true});
    },

    _configureOptions(strict?: boolean) {
      return PatchUtils.zlOptsToYOpts(this._zodlaw() ?? {}, {
        demandOption: strict,
        describe: this._def.description,
        type: 'string',
      });
    },
  };

  Object.assign(
    PatchUtils.assignZodlawOptionProto(ZodStringProto),
    ZodlawStringProto,
  );

  return zod;
}

function patchZodArray(zod: typeof z) {
  const ZodArrayProto = zod.ZodArray.prototype;

  /**
   * method implementations specific to `ZodString`
   */
  const ZodlawArrayProto: ThisType<z.ZodArray<z.ZodTypeAny>> = {
    normalize() {
      return this.option({normalize: true});
    },

    _configureOptions(strict?: boolean) {
      const sourceType = PatchUtils.getSource(this);

      if (sourceType._def.typeName !== z.ZodFirstPartyTypeKind.ZodString) {
        throw new TypeError(
          `Cannot convert ZodArray to Yargs options; element type must be ZodString, got ${sourceType}`,
        );
      }

      return PatchUtils.zlOptsToYOpts(this._zodlaw() ?? {}, {
        demandOption: strict,
        describe: this._def.description,
        type: 'string',
        array: true,
      });
    },
  };

  Object.assign(
    PatchUtils.assignZodlawOptionProto(ZodArrayProto),
    ZodlawArrayProto,
  );

  return zod;
}

function patchZodNumber(zod: typeof z) {
  const ZodNumberProto = zod.ZodNumber.prototype;

  /**
   * method implementations specific to `ZodString`
   */
  const ZodlawNumberProto: ThisType<z.ZodNumber> = {
    _configureOptions(strict?: boolean) {
      return PatchUtils.zlOptsToYOpts(this._zodlaw() ?? {}, {
        demandOption: strict,
        describe: this._def.description,
        type: 'number',
      });
    },
  };

  Object.assign(
    PatchUtils.assignZodlawOptionProto(ZodNumberProto),
    ZodlawNumberProto,
  );

  return zod;
}

export function register(zod: typeof z) {
  return Object.entries(Monkeypatchers)
    .filter(([kind]) => !zod[kind as ZodlawKind].prototype[kZodlaw])
    .reduce((zod, [, register]) => register(zod), zod);
}
